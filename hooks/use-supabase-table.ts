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
      notification.error(`Failed to load ${tableName}`, errorMessage)
    } else {
      setData(fetchedData || [])
    }
    setLoading(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName, options?.filterColumn, options?.filterValue, options?.orderBy?.column, options?.orderBy?.ascending])

  useEffect(() => {
    fetchData()

    if (!options?.filterColumn || options?.filterValue) {
      const channel = supabase
        .channel(`${tableName}-changes-${options?.filterValue || "all"}`)
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
        .subscribe((status) => {
          if (status === 'SUBSCRIBED') {
            console.log(`Subscribed to ${tableName} changes for ${options?.filterValue || 'all'}`);
          }
        })

      return () => {
        supabase.removeChannel(channel)
      }
    }
    // Only depend on primitive values, not objects or functions
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName, options?.filterColumn, options?.filterValue, fetchData])

  const createItem = useCallback(
    async (item: Partial<T>): Promise<T> => {
      setError(null)
      const { data: newItem, error: createError } = await supabase
        .from(tableName)
        .insert(item)
        .select()
        .single()

      if (createError) {
        console.error(`Error creating item in ${tableName}:`, createError)
        setError(createError)
        notification.error(`Failed to create item in ${tableName}`, createError.message)
        throw createError
      }
      return newItem
    },
    [tableName, supabase]
  )

  const updateItem = useCallback(
    async (id: string, updates: Partial<T>): Promise<T> => {
      setError(null)
      const { data: updatedItem, error: updateError } = await supabase
        .from(tableName)
        .update(updates)
        .eq(primaryKey, id)
        .select()
        .single()

      if (updateError) {
        console.error(`Error updating item in ${tableName}:`, updateError)
        setError(updateError)
        notification.error(`Failed to update item in ${tableName}`, updateError.message)
        throw updateError
      }
      return updatedItem
    },
    [tableName, primaryKey, supabase]
  )

  const deleteItem = useCallback(
    async (id: string): Promise<void> => {
      setError(null)
      const { error: deleteError } = await supabase
        .from(tableName)
        .delete()
        .eq(primaryKey, id)

      if (deleteError) {
        console.error(`Error deleting item from ${tableName}:`, deleteError)
        setError(deleteError)
        notification.error(`Failed to delete item from ${tableName}`, deleteError.message)
        throw deleteError
      }
    },
    [tableName, primaryKey, supabase]
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
