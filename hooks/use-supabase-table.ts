import { useState, useEffect, useCallback } from "react"
import { createClient } from "@/lib/supabase/client"
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js"
import { notification } from "@/components/ui/notification"

interface UseSupabaseTableOptions<T> {
  filterColumn?: string
  filterValue?: string | null
  orderBy?: { column: string; ascending?: boolean }
  onInsert?: (newItem: T) => void
  onUpdate?: (updatedItem: T) => void
  onDelete?: (deletedItemId: string) => void
}

export function useSupabaseTable<T extends { id: string }>(
  tableName: string,
  primaryKey: string = "id",
  options?: UseSupabaseTableOptions<T>
) {
  const supabase = createClient()
  const [data, setData] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  const fetchData = useCallback(async () => {
    // Skip query if filterColumn is specified but filterValue is null/undefined
    // This prevents unnecessary queries when no engagement is selected
    if (options?.filterColumn && (options?.filterValue === null || options?.filterValue === undefined)) {
      setData([])
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)
    let query = supabase.from(tableName).select("*")

    if (options?.filterColumn && options?.filterValue) {
      query = query.eq(options.filterColumn, options.filterValue)
    }

    if (options?.orderBy) {
      query = query.order(options.orderBy.column, { ascending: options.orderBy.ascending ?? true })
    }

    const { data: fetchedData, error: fetchError } = await query

    if (fetchError) {
      const errorMessage = fetchError.message || fetchError.details || fetchError.hint || JSON.stringify(fetchError) || "Unknown error"
      console.error(`Error fetching data from ${tableName}:`, {
        message: fetchError.message,
        details: fetchError.details,
        hint: fetchError.hint,
        code: fetchError.code,
        error: fetchError
      })
      setError(fetchError instanceof Error ? fetchError : new Error(errorMessage))
      setData([])
      // Only show error notification for actual errors, not when skipping queries
      notification.error(`Failed to load ${tableName}`, errorMessage)
    } else {
      setData(fetchedData || [])
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName, options?.filterColumn, options?.filterValue, options?.orderBy?.column, options?.orderBy?.ascending])

  useEffect(() => {
    fetchData()

    // Skip real-time subscription if filterColumn is specified but filterValue is null/undefined
    if (options?.filterColumn && (options?.filterValue === null || options?.filterValue === undefined)) {
      return
    }

    // Subscribe to real-time changes
    const channelName = options?.filterColumn && options?.filterValue
      ? `${tableName}-changes-${options.filterValue}`
      : `${tableName}-changes-all`
    
    const channel = supabase
      .channel(channelName)
      .on<T>(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: tableName,
          filter: options?.filterColumn && options?.filterValue
            ? `${options.filterColumn}=eq.${options.filterValue}`
            : undefined,
        },
          (payload: RealtimePostgresChangesPayload<T>) => {
            if (payload.errors) {
              console.error(`Realtime error for ${tableName}:`, payload.errors)
              notification.error(`Real-time sync error for ${tableName}`)
              // For now, re-fetch data on error to ensure consistency
              fetchData()
              return
            }

            switch (payload.eventType) {
              case "INSERT":
                const newItem = payload.new as T
                setData((prev) => {
                  const exists = prev.some(item => item.id === newItem.id);
                  return exists ? prev : [...prev, newItem];
                });
                options?.onInsert?.(newItem);
                break
              case "UPDATE":
                const updatedItem = payload.new as T
                setData((prev) =>
                  prev.map((item) => (item.id === updatedItem.id ? updatedItem : item))
                )
                options?.onUpdate?.(updatedItem);
                break
              case "DELETE":
                const deletedItemId = (payload.old as any)?.[primaryKey]
                if (deletedItemId) {
                  setData((prev) => prev.filter((item) => item.id !== deletedItemId))
                  options?.onDelete?.(deletedItemId);
                }
                break
              default:
                break
            }
          }
        )
        .subscribe((status, err) => {
          if (status === 'SUBSCRIBED') {
            // Subscription successful
          } else if (status === 'CHANNEL_ERROR') {
            // Only log if there's an actual error (not just real-time not enabled)
            if (err) {
              console.error(`Failed to subscribe to ${tableName} changes:`, err)
            } else {
              // Real-time replication may not be enabled for this table in Supabase
              // This is expected if real-time is disabled - data will still sync on manual refresh
              console.debug(`Real-time subscription unavailable for ${tableName} (real-time may not be enabled)`)
            }
          }
        })

      return () => {
        supabase.removeChannel(channel)
      }
    // Only depend on primitive values, not objects or functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName, options?.filterColumn, options?.filterValue, fetchData])

  const createItem = useCallback(
    async (item: Partial<T>): Promise<T> => {
      setError(null)
      
      // Optimistic update - add temporary item with unique ID
      // Each finding gets a unique UUID from the database, so we don't need to check for duplicates
      const tempId = `temp-${Date.now()}-${Math.random().toString(36).substring(7)}`
      const tempItem = { ...item, id: tempId } as T
      setData((prev) => {
        // Check if item matches filter
        if (options?.filterColumn && options?.filterValue) {
          const matchesFilter = (item as any)[options.filterColumn] === options.filterValue
          return matchesFilter ? [...prev, tempItem] : prev
        }
        return [...prev, tempItem]
      })
      
      const { data: newItem, error: createError } = await supabase
        .from(tableName)
        .insert(item)
        .select()
        .single()

      if (createError) {
        // Rollback optimistic update
        setData((prev) => prev.filter((i) => i.id !== tempId))
        console.error(`Error creating item in ${tableName}:`, createError)
        setError(createError)
        
        // Better error message for duplicate key errors
        let errorMessage = createError.message
        if (createError.message.includes("duplicate key") || createError.message.includes("unique constraint")) {
          if (tableName === 'findings' && createError.message.includes("engagement_id")) {
            errorMessage = "Database constraint error: There's a UNIQUE constraint on engagement_id preventing multiple findings. Run the migration 'fix_findings_unique_constraint.sql' to fix this."
          } else {
            errorMessage = "A database constraint is preventing this. Each finding has a unique UUID ID, so you should be able to create multiple findings."
          }
        }
        
        notification.error(`Failed to create item in ${tableName}`, errorMessage)
        throw createError
      }
      
      // Replace temp item with real item (database-generated UUID)
      setData((prev) => {
        const filtered = prev.filter((i) => i.id !== tempId)
        // Check if the new item already exists (shouldn't happen, but safety check)
        const exists = filtered.some((i) => i.id === newItem.id)
        return exists ? filtered : [...filtered, newItem]
      })
      
      return newItem
    },
    [tableName, supabase, options?.filterColumn, options?.filterValue]
  )

  const updateItem = useCallback(
    async (id: string, updates: Partial<T>): Promise<T> => {
      setError(null)
      
      // Optimistic update
      setData((prev) =>
        prev.map((item) => (item.id === id ? { ...item, ...updates } as T : item))
      )
      
      const { data: updatedItem, error: updateError } = await supabase
        .from(tableName)
        .update(updates)
        .eq(primaryKey, id)
        .select()
        .single()

      if (updateError) {
        // Rollback - refetch to get correct state
        fetchData()
        console.error(`Error updating item in ${tableName}:`, updateError)
        setError(updateError)
        notification.error(`Failed to update item in ${tableName}`, updateError.message)
        throw updateError
      }
      
      // Update with server response
      setData((prev) =>
        prev.map((item) => (item.id === id ? updatedItem : item))
      )
      
      return updatedItem
    },
    [tableName, primaryKey, supabase, fetchData]
  )

  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      setError(null)
      
      // Optimistic update - remove item immediately
      const deletedItem = data.find((item) => item.id === id)
      setData((prev) => prev.filter((item) => item.id !== id))
      
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq(primaryKey, id)

      if (deleteError) {
        // Rollback - restore item
        if (deletedItem) {
          setData((prev) => {
            const exists = prev.some((item) => item.id === id)
            return exists ? prev : [...prev, deletedItem]
          })
        }
        console.error(`Error deleting item from ${tableName}:`, deleteError)
        setError(deleteError)
        notification.error(`Failed to delete item from ${tableName}`, deleteError.message)
        throw deleteError
      }
    },
    [tableName, primaryKey, supabase, data]
  )

  return {
    data,
    loading,
    error,
    createItem,
    updateItem,
    deleteItem,
    refetch: fetchData,
  }
}
