import React, { useContext } from 'react'
import { StoreApi, useStore } from 'zustand'

export type WithStateGetters<StateType> = {
  [key in keyof StateType]: StateType[key]
}

function createGetters<StateType extends object>(store: StoreApi<StateType>) {
  return Object.fromEntries(
    Object.keys(store.getState()).map((key) => {
      const selector = (state: StateType) => state[key as keyof StateType]
      return [key, { get: () => useStore(store, selector) }]
    })
  )
}

export function withGetters<StateType extends object>(
  store: StoreApi<StateType>
) {
  return Object.create(store, createGetters(store)) as StoreApi<StateType> &
    WithStateGetters<StateType>
}

export function useZustand<StateType extends object>(
  context: React.Context<StoreApi<StateType> | null>
) {
  const store = useContext(context)
  if (!store) throw new Error('Missing ContextProvider in the tree')
  return withGetters(store)
}
