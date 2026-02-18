"use client"

import { createContext, useContext, ReactNode } from "react"
import { useCategories, type Category, type CategoryTreeNode } from "@/hooks/use-categories"

interface CategoriesContextType {
  categories: Category[]
  categoryTree: CategoryTreeNode[]
  loading: boolean
  error: Error | null
  createCategory: (category: Omit<Category, "id" | "createdAt" | "updatedAt">) => Promise<Category>
  updateCategory: (id: string, updates: Partial<Category>) => Promise<Category>
  deleteCategory: (id: string) => Promise<void>
}

const CategoriesContext = createContext<CategoriesContextType | undefined>(undefined)

export function CategoriesProvider({ children }: { children: ReactNode }) {
  const categories = useCategories()

  return (
    <CategoriesContext.Provider value={categories}>
      {children}
    </CategoriesContext.Provider>
  )
}

export function useCategoriesContext() {
  const context = useContext(CategoriesContext)
  if (context === undefined) {
    throw new Error("useCategoriesContext must be used within a CategoriesProvider")
  }
  return context
}
