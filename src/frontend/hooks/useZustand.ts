import React, { useContext } from 'react'
import { StoreApi, useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

export type WithStateGetters<StateType> = {
  [key in keyof StateType]: StateType[key]
}

export type WithUse<StateType> = {
  use: <T>(selector: (state: StateType) => T) => T
  useShallow: <T>(selector: (state: StateType) => T) => T
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

export function withUse<StateType>(store: StoreApi<StateType>) {
  return Object.assign(store, {
    use: <T>(selector: (state: StateType) => T) => useStore(store, selector),
    useShallow: <T>(selector: (state: StateType) => T) =>
      useStore(store, useShallow(selector))
  }) as StoreApi<StateType> & WithUse<StateType>
}

export function useZustand<StateType extends object>(
  context: React.Context<StoreApi<StateType> | null>
) {
  const store = useContext(context)
  if (!store) throw new Error('Missing ContextProvider in the tree')
  return withGetters(withUse(store)) as StoreApi<StateType> &
    WithUse<StateType> &
    WithStateGetters<StateType>
}
