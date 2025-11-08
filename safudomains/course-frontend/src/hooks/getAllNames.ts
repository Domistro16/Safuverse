import { gql, useQuery } from '@apollo/client'
import { useState, useEffect, useRef } from 'react'

const UNWRAPPED_QUERY = gql`
  query UnwrappedByOwner($owner: String!, $first: Int!, $skip: Int!) {
    domains(
      where: { owner: $owner, name_ends_with: ".safu" }
      first: $first
      skip: $skip
      orderBy: name
      orderDirection: asc
    ) {
      name
      expiryDate
      createdAt
    }
  }
`

const WRAPPED_QUERY = gql`
  query WrappedByOwner($owner: String!, $first: Int!, $skip: Int!) {
    wrappedDomains(
      where: { owner: $owner, name_ends_with: ".safu" }
      first: $first
      skip: $skip
      orderBy: name
      orderDirection: asc
    ) {
      name
      expiryDate
    }
  }
`
function usePaged(
  query: any,
  owner: string,
  setter: React.Dispatch<React.SetStateAction<any[]>>,
  rootField: 'domains' | 'wrappedDomains',
) {
  const pageSize = 200
  const skipRef = useRef(0)
  const { data, fetchMore } = useQuery<any>(query, {
    variables: { owner, first: pageSize, skip: skipRef.current },
    skip: !owner,
  })

  useEffect(() => {
    const items = data?.[rootField] as
      | Array<{ name: string; expiryDate: string; createdAt: string }>
      | undefined
    if (!items) return

    setter((prev) => [...prev, ...items])

    if (items.length === pageSize) {
      skipRef.current += pageSize
      fetchMore({ variables: { skip: skipRef.current } })
    }

  }, [data, fetchMore, setter, rootField])
}

export function useAllOwnedNames(owner: string) {
  const [unwrapped, setUnwrapped] = useState<any[]>([])
  const [wrapped, setWrapped] = useState<any[]>([])
  usePaged(WRAPPED_QUERY, owner, setWrapped, 'wrappedDomains')
  usePaged(UNWRAPPED_QUERY, owner, setUnwrapped, 'domains')

  // merge and dedupe by name
  const all = [...unwrapped, ...wrapped]
  const unique = Array.from(new Map(all.map((d) => [d.name, d])).values())
  return {
    domains: unique,
  }
}
