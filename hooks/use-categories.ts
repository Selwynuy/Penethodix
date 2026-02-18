"use client"

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import { useAuth } from "@/contexts/auth-context"
import type { Database } from "@/lib/supabase/database.types"

type CategoryRow = Database["public"]["Tables"]["categories"]["Row"]

export interface Category {
  id: string
  name: string
  color: string
  parentId?: string | null
  // Content fields (CherryTree-style - categories can have content)
  description?: string
  steps?: string[]
  commands?: { command: string; description: string }[]
  notes?: string
  tags?: string[]
  owaspTags?: string[]
  phase?: string
  service?: string
  // Metadata
  createdAt: string
  updatedAt: string
}

export interface CategoryTreeNode extends Category {
  children: CategoryTreeNode[]
}

function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    parentId: row.parent_id || null,
    // Content fields
    description: row.description || "",
    steps: row.steps || [],
    commands: (row.commands as unknown as Category["commands"]) || [],
    notes: row.notes || "",
    tags: row.tags || [],
    owaspTags: row.owasp_tags || [],
    phase: row.phase || undefined,
    service: row.service || undefined,
    // Metadata
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

// Build tree structure from flat categories
export function buildCategoryTree(categories: Category[]): CategoryTreeNode[] {
  const categoryMap = new Map<string, CategoryTreeNode>()
  const rootCategories: CategoryTreeNode[] = []

  // First pass: create all nodes
  categories.forEach((cat) => {
    categoryMap.set(cat.id, { ...cat, children: [] })
  })

  // Second pass: build tree
  categories.forEach((cat) => {
    const node = categoryMap.get(cat.id)!
    if (cat.parentId && categoryMap.has(cat.parentId)) {
      const parent = categoryMap.get(cat.parentId)!
      parent.children.push(node)
    } else {
      rootCategories.push(node)
    }
  })

  // Sort each level alphabetically
  const sortTree = (nodes: CategoryTreeNode[]): CategoryTreeNode[] => {
    return nodes
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((node) => ({
        ...node,
        children: sortTree(node.children),
      }))
  }

  return sortTree(rootCategories)
}

export function useCategories() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuth()
  const supabase = createClient()

  useEffect(() => {
    // Fetch initial categories
    async function fetchCategories() {
      try {
        setLoading(true)
        
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
  }, [supabase, user])

  const createCategory = async (category: Omit<Category, "id" | "createdAt" | "updatedAt">) => {
    const { data, error } = await supabase
      .from("categories")
      .insert({
        name: category.name,
        color: category.color,
        parent_id: category.parentId || null,
        description: category.description || "",
        steps: category.steps || [],
        commands: category.commands || [],
        notes: category.notes || "",
        tags: category.tags || [],
        owasp_tags: category.owaspTags || [],
        phase: category.phase || null,
        service: category.service || null,
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
    if (updates.parentId !== undefined) updateData.parent_id = updates.parentId
    if (updates.description !== undefined) updateData.description = updates.description
    if (updates.steps !== undefined) updateData.steps = updates.steps
    if (updates.commands !== undefined) updateData.commands = updates.commands
    if (updates.notes !== undefined) updateData.notes = updates.notes
    if (updates.tags !== undefined) updateData.tags = updates.tags
    if (updates.owaspTags !== undefined) updateData.owasp_tags = updates.owaspTags
    if (updates.phase !== undefined) updateData.phase = updates.phase
    if (updates.service !== undefined) updateData.service = updates.service

    const { data, error } = await supabase
      .from("categories")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      // Revert optimistic update on error
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
