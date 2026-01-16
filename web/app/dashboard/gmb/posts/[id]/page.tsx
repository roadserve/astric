'use client'

import React, { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import Image from 'next/image'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'

type GmbPost = {
  id: string
  title: string | null
  content: string
  call_to_action: string | null
  action_url: string | null
  media_urls: string[] | null
  post_type: string
  target_locations: string[] | null
  status: string
  scheduled_at: string | null
  published_at: string | null
  google_post_name?: string | null
  created_at: string
  updated_at: string
}

type GmbPostPublication = {
  id: string
  post_id: string
  gmb_location_id: string
  google_post_name: string | null
  status: string
  error_text: string | null
  created_at: string
}

export default function GmbPostDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const supabase = createClientComponentClient()

  const postId = String((params as any)?.id || '')
  const [loading, setLoading] = useState(true)
  const [errorText, setErrorText] = useState<string | null>(null)
  const [post, setPost] = useState<GmbPost | null>(null)
  const [publications, setPublications] = useState<GmbPostPublication[]>([])
  const [locationNameById, setLocationNameById] = useState<Record<string, string>>({})

  useEffect(() => {
    const run = async () => {
      try {
        setLoading(true)
        setErrorText(null)

        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setErrorText('Please login first.')
          return
        }

        const { data: orgMember, error: orgErr } = await supabase
          .from('organization_members')
          .select('organization_id')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .maybeSingle()

        if (orgErr) throw orgErr
        const orgId = orgMember?.organization_id
        if (!orgId) {
          setErrorText('Organization not found.')
          return
        }

        const { data, error } = await supabase.functions.invoke('gmb_get_data', {
          body: { organization_id: orgId, only: 'post_details', post_id: postId },
        })
        if (error) throw error

        setPost((data as any)?.post ?? null)
        setPublications(Array.isArray((data as any)?.post_publications) ? (data as any).post_publications : [])
        setLocationNameById((data as any)?.location_name_by_id ?? {})
      } catch (e: any) {
        setErrorText(e?.message || String(e))
      } finally {
        setLoading(false)
      }
    }
    if (postId) run()
  }, [postId, supabase])

  const targets = useMemo(() => {
    const ids = Array.isArray(post?.target_locations) ? post?.target_locations : []
    return ids.map((id) => ({ id, name: locationNameById[id] || id }))
  }, [locationNameById, post?.target_locations])

  const pubStats = useMemo(() => {
    let ok = 0
    let failed = 0
    for (const r of publications) {
      if (r.status === 'published') ok += 1
      if (r.status === 'failed') failed += 1
    }
    return { ok, failed }
  }, [publications])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2">
        <div>
          <div className="text-sm text-gray-500">GMB</div>
          <div className="text-xl font-semibold text-gray-900">Post details</div>
        </div>
        <Button variant="outline" onClick={() => router.back()}>
          Back
        </Button>
      </div>

      {loading ? (
        <Card>
          <CardContent className="py-10 text-sm text-gray-600">Loading…</CardContent>
        </Card>
      ) : errorText ? (
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
            <CardDescription>{errorText}</CardDescription>
          </CardHeader>
        </Card>
      ) : !post ? (
        <Card>
          <CardHeader>
            <CardTitle>Not found</CardTitle>
            <CardDescription>This post does not exist or you don’t have access.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <div className="grid gap-4 lg:grid-cols-3">
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <CardTitle className="truncate">{post.title || 'Untitled'}</CardTitle>
                  <CardDescription>
                    Created: {new Date(post.created_at).toLocaleString()}
                    {post.updated_at ? ` • Updated: ${new Date(post.updated_at).toLocaleString()}` : ''}
                    {post.published_at ? ` • Published: ${new Date(post.published_at).toLocaleString()}` : ''}
                    {post.scheduled_at ? ` • Scheduled: ${new Date(post.scheduled_at).toLocaleString()}` : ''}
                  </CardDescription>
                </div>
                <Badge
                  variant={
                    post.status === 'published'
                      ? 'success'
                      : post.status === 'failed'
                        ? 'danger'
                        : post.status === 'scheduled'
                          ? 'info'
                          : 'neutral'
                  }
                >
                  {post.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border bg-gray-50 p-4">
                <div className="text-xs font-semibold text-gray-700">Content</div>
                <div className="mt-2 whitespace-pre-wrap text-sm text-gray-900">{post.content}</div>
              </div>

              {post.call_to_action || post.action_url ? (
                <div className="rounded-xl border bg-gray-50 p-4">
                  <div className="text-xs font-semibold text-gray-700">CTA</div>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <div className="text-sm text-gray-900">{post.call_to_action || '—'}</div>
                    {post.action_url ? (
                      <a
                        href={post.action_url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-xs font-medium text-gray-900 underline underline-offset-4"
                      >
                        Open link
                      </a>
                    ) : null}
                  </div>
                  {post.action_url ? <div className="mt-1 text-xs text-gray-700 break-all">{post.action_url}</div> : null}
                </div>
              ) : null}

              {Array.isArray(post.media_urls) && post.media_urls.length ? (
                <div className="rounded-xl border bg-gray-50 p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-gray-700">Media</div>
                    <div className="text-[11px] text-gray-500">{post.media_urls.length} file(s)</div>
                  </div>

                  <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {post.media_urls.slice(0, 12).map((u) => (
                      <a
                        key={u}
                        href={u}
                        target="_blank"
                        rel="noreferrer"
                        className="group rounded-xl border bg-white overflow-hidden"
                        title="Open image in new tab"
                      >
                        <div className="relative aspect-[4/3] bg-gray-100">
                          <Image
                            src={u}
                            alt="Post media"
                            fill
                            className="object-cover transition-transform group-hover:scale-[1.02]"
                          />
                        </div>
                        <div className="p-2">
                          <div className="text-[11px] text-gray-600 line-clamp-2 break-all">{u}</div>
                        </div>
                      </a>
                    ))}
                  </div>

                  {post.media_urls.length > 12 ? (
                    <div className="mt-2 text-[11px] text-gray-500">+ {post.media_urls.length - 12} more…</div>
                  ) : null}
                </div>
              ) : null}
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Targets</CardTitle>
                <CardDescription>{targets.length} location(s)</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {targets.length ? (
                  targets.slice(0, 12).map((t) => (
                    <div key={t.id} className="rounded-lg border bg-white px-2 py-1 text-xs text-gray-800">
                      {t.name}
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-gray-500">—</div>
                )}
                {targets.length > 12 ? (
                  <div className="text-[11px] text-gray-500">+ {targets.length - 12} more…</div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Publish results</CardTitle>
                <CardDescription>
                  OK {pubStats.ok} • Failed {pubStats.failed}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {publications.length ? (
                  <div className="space-y-2 max-h-[420px] overflow-y-auto pr-1">
                    {publications.map((r) => (
                      <div key={r.id} className="rounded-xl border bg-white p-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="text-xs font-medium text-gray-900 truncate">
                            {locationNameById[r.gmb_location_id] || r.gmb_location_id}
                          </div>
                          <Badge variant={r.status === 'published' ? 'success' : r.status === 'failed' ? 'danger' : 'neutral'}>
                            {r.status}
                          </Badge>
                        </div>
                        <div className="mt-1 text-[11px] text-gray-500">{new Date(r.created_at).toLocaleString()}</div>
                        {r.error_text ? (
                          <div className="mt-1 text-[11px] text-rose-700 break-words">{String(r.error_text).slice(0, 600)}</div>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-600">No publication logs yet.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}

