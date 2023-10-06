import React, { useEffect, useRef } from 'react'
import { createStore } from 'zustand'
import { useZustand } from '../useZustand'
import { act, renderHook } from '@testing-library/react'

type StoreType = {
  foo: string
  bar: number
  baz: boolean
  arr: number[]
  add: (num: number) => void
}
const store = createStore<StoreType>()((set) => ({
  foo: 'bar',
  bar: 42,
  baz: false,
  arr: [1, 2, 3],
  add: (num: number) => set(({ arr }) => ({ arr: [...arr, num] }))
}))
const StoreContext = React.createContext<typeof store | null>(store)

const ContextProvider = ({ children }: { children: React.ReactNode }) => (
  <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
)

describe('useZustand', () => {
  test('getter style / destructuring store access', () => {
    const { result } = renderHook(
      () => {
        // just pick some properties off the store
        const { foo, bar, arr, add } = useZustand(StoreContext)
        // to keep track of re-renders
        const updateCount = useRef(0)
        useEffect(() => {
          updateCount.current += 1
        })

        return { foo, bar, arr, add, updateCount }
      },
      { wrapper: ContextProvider }
    )

    // test properties being pulled from store correctly
    expect(result.current.foo).toEqual('bar')
    expect(result.current.bar).toEqual(42)
    expect(result.current.arr).toEqual([1, 2, 3])
    expect(result.current.updateCount.current).toBe(1)

    // test properties being updated with merge style update
    act(() => store.setState({ foo: 'flurb' }))
    expect(result.current.foo).toEqual('flurb')
    expect(result.current.bar).toEqual(42)
    expect(result.current.arr).toEqual([1, 2, 3])
    expect(result.current.updateCount.current).toBe(2)

    // test properties being updated with functional style update
    act(() => store.setState(({ bar }) => ({ bar: bar + 27 })))
    expect(result.current.foo).toEqual('flurb')
    expect(result.current.bar).toEqual(69)
    expect(result.current.arr).toEqual([1, 2, 3])
    expect(result.current.updateCount.current).toBe(3)

    // test properties being updated with store action
    act(() => result.current.add(4))
    expect(result.current.foo).toEqual('flurb')
    expect(result.current.bar).toEqual(69)
    expect(result.current.arr).toEqual([1, 2, 3, 4])
    expect(result.current.updateCount.current).toBe(4)

    // update non-observed property to track update behavior
    act(() => store.setState({ baz: true }))
    expect(result.current.updateCount.current).toBe(4)
  })

  test('use() / useShallow() access', () => {
    const { result } = renderHook(
      () => {
        const arr = useZustand(StoreContext).use((s) => s.arr)
        const add = useZustand(StoreContext).use((s) => s.add)
        const keys = useZustand(StoreContext).useShallow((s) => Object.keys(s))
        // to keep track of re-renders
        const updateCount = useRef(0)
        useEffect(() => {
          updateCount.current += 1
        })

        return { arr, add, keys, updateCount }
      },
      { wrapper: ContextProvider }
    )
    const { keys } = result.current

    // test properties being pulled from store correctly
    expect(result.current.arr).toEqual([1, 2, 3, 4])
    expect(result.current.keys).toEqual(['foo', 'bar', 'baz', 'arr', 'add'])
    expect(result.current.updateCount.current).toBe(1)

    // test update of unrelated property being ignored
    act(() => store.setState({ foo: 'flurb' }))
    expect(result.current.arr).toEqual([1, 2, 3, 4])
    expect(result.current.keys).toBe(keys)
    expect(result.current.updateCount.current).toBe(1)

    // test properties being updated with functional style update
    act(() => store.setState(({ arr }) => ({ arr: arr.slice(0, -1) })))
    expect(result.current.arr).toEqual([1, 2, 3])
    expect(result.current.keys).toBe(keys)
    expect(result.current.updateCount.current).toBe(2)

    // test properties being updated with store action
    act(() => result.current.add(4))
    expect(result.current.arr).toEqual([1, 2, 3, 4])
    expect(result.current.keys).toBe(keys)
    expect(result.current.updateCount.current).toBe(3)
  })
})
