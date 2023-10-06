import React from 'react'
import { createStore } from 'zustand'
import { useZustand } from '../useZustand'
import { act, renderHook } from '@testing-library/react'

const initialState = {
  foo: 'bar',
  bar: 42,
  arr: [1, 2, 3]
}
const store = createStore<typeof initialState>()(() => initialState)
const StoreContext = React.createContext<typeof store | null>(store)

const ContextProvider = ({ children }: { children: React.ReactNode }) => (
  <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
)

test('useZustand hook', () => {
  const { result } = renderHook(
    () => {
      const { foo, bar } = useZustand(StoreContext)

      return { foo, bar }
    },
    { wrapper: ContextProvider }
  )

  expect(result.current.foo).toEqual('bar')
  expect(result.current.bar).toEqual(42)

  act(() => store.setState({ foo: 'flurb' }))
  expect(result.current.foo).toEqual('flurb')
  expect(result.current.bar).toEqual(42)

  act(() => store.setState(({ bar }) => ({ bar: bar + 27 })))
  expect(result.current.foo).toEqual('flurb')
  expect(result.current.bar).toEqual(69)
})
