"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Database } from "@/lib/supabase/database.types"

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"]

export interface Category {
  id: string
  name: string
  color: string
  createdAt: string
  updatedAt: string
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial categories
    async function fetchCategories() {
      try {
        setLoading(true)
        // Get current user to filter categories
        const { data: { user } } = await supabase.auth.getUser()
        
        let query = supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true })
        
        // Filter by user_id if authenticated, otherwise show all (for development)
        if (user) {
          query = query.eq("user_id", user.id)
        }
        
        const { data, error } = await query

        if (error) throw error
        setCategories((data || []).map(mapCategory))
      } catch (err) {
        setError(err instanceof Error ? err : new Error("Failed to fetch categories"))
      } finally {
        setLoading(false)
      }
    }

    fetchCategories()

    // Subscribe to real-time changes
    const channel = supabase
      .channel("categories-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "categories",
        },
        async () => {
          const { data: { user } } = await supabase.auth.getUser()
          let query = supabase
            .from("categories")
            .select("*")
            .order("name", { ascending: true })
          
          if (user) {
            query = query.eq("user_id", user.id)
          }
          
          const { data } = await query
          if (data) {
            setCategories(data.map(mapCategory))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [supabase])

  const createCategory = async (category: Omit<Category, "id" | "createdAt" | "updatedAt">) => {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser()
    
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: category.name,
        color: category.color,
        user_id: user?.id || null,
      })
      .select()
      .single()

    if (error) {
      // Enhance error with more details
      const enhancedError = new Error(error.message || "Failed to create category")
      ;(enhancedError as any).details = error.details
      ;(enhancedError as any).hint = error.hint
      ;(enhancedError as any).code = error.code
      throw enhancedError
    }
    const mapped = mapCategory(data)
    // Optimistically update state
    setCategories((prev) => [...prev, mapped].sort((a, b) => a.name.localeCompare(b.name)))
    return mapped
  }

  const updateCategory = async (id: string, updates: Partial<Category>) => {
    // Optimistically update state
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === id ? { ...cat, ...updates } : cat
      ).sort((a, b) => a.name.localeCompare(b.name))
    )

    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (updates.name !== undefined) updateData.name = updates.name
    if (updates.color !== undefined) updateData.color = updates.color

    const { data, error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      // Revert optimistic update on error
      const { data: { user } } = await supabase.auth.getUser()
      let query = supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true })
      
      if (user) {
        query = query.eq("user_id", user.id)
      }
      
      const { data: reverted } = await query
      if (reverted) {
        setCategories(reverted.map(mapCategory))
      }
      throw error
    }
    const mapped = mapCategory(data)
    // Update with server response
    setCategories((prev) =>
      prev.map((cat) => (cat.id === id ? mapped : cat)).sort((a, b) => a.name.localeCompare(b.name))
    )
    return mapped
  }

  const deleteCategory = async (id: string) => {
    // Optimistically remove from state
    setCategories((prev) => prev.filter((cat) => cat.id !== id))
    
    const { error } = await supabase.from("categories").delete().eq("id", id)
    if (error) {
      // Revert optimistic update on error by refetching
      const { data: { user } } = await supabase.auth.getUser()
      let query = supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true })
      
      if (user) {
        query = query.eq("user_id", user.id)
      }
      
      const { data } = await query
      if (data) {
        setCategories(data.map(mapCategory))
      }
      throw error
    }
  }

  return {
    categories,
    loading,
    error,
    createCategory,
    updateCategory,
    deleteCategory,
  }
}
