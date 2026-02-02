"use client"

export type NotificationType = "rating" | "comment" | "like" | "message" | "share"

export type NotificationItem = {
  id: string // 서버 붙일 때 string 권장
  type: NotificationType
  title?: string
  message: string
  time: string
  link: string
  read: boolean
  createdAt?: string // API 붙일 때 ISO
}

type PersistedState = {
  version: 1
  items: NotificationItem[]
  deletedIds: string[] // tombstone: 서버에서 재전송돼도 계속 숨김
}

const STORAGE_KEY = "cooksync:notifications:v1"

const initialNotifications: NotificationItem[] = [
  {
    id: "1",
    type: "rating",
    title: "미슐랭 평가단이 왔다갔어요",
    message: "김대전님이 회원님의 레시피에 평점을 남겼습니다.",
    time: "5분 전",
    read: false,
    link: "/recipes/japchae",
  },
  {
    id: "2",
    type: "like",
    title: "좋아요 알림",
    message: "박요리님이 회원님의 레시피를 좋아합니다.",
    time: "1시간 전",
    read: false,
    link: "/recipes/japchae",
  },
  {
    id: "3",
    type: "comment",
    title: "미슐랭 평가단이 왔다갔어요",
    message: "이맛집님이 회원님의 레시피에 댓글을 남겼습니다.",
    time: "3시간 전",
    read: true,
    link: "/recipes/japchae",
  },
  {
    id: "4",
    type: "message",
    title: "쪽지 알림",
    message: "최요리님이 쪽지를 보냈습니다.",
    time: "어제",
    read: true,
    link: "/messages/user4",
  },
  {
    id: "5",
    type: "share",
    title: "나눔 알림",
    message: "재료 나눔 요청이 수락되었습니다.",
    time: "2일 전",
    read: true,
    link: "/community",
  },
]

/**
 * ===========================
 * Store (single source of truth)
 * - 같은 탭: subscribe(메모리 이벤트)
 * - 다른 탭: window 'storage' 이벤트
 * - Persist: localStorage
 * ===========================
 */
let state: PersistedState = { version: 1, items: initialNotifications, deletedIds: [] }
let initialized = false
const listeners = new Set<() => void>()

function safeParse(raw: string | null): PersistedState | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw)
    if (!parsed || parsed.version !== 1) return null
    return parsed as PersistedState
  } catch {
    return null
  }
}

function loadFromStorage() {
  if (typeof window === "undefined") return
  const saved = safeParse(localStorage.getItem(STORAGE_KEY))
  if (saved) {
    state = saved
  } else {
    // 첫 진입: 더미를 저장해두면, 이후부터는 항상 동일 데이터로 시작
    persist()
  }
}

function persist() {
  if (typeof window === "undefined") return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

function emit() {
  listeners.forEach((l) => l())
}

function ensureInit() {
  if (initialized) return
  initialized = true

  loadFromStorage()

  // 다른 탭 변경 동기화
  if (typeof window !== "undefined") {
    window.addEventListener("storage", (e) => {
      if (e.key !== STORAGE_KEY) return
      const next = safeParse(e.newValue)
      if (!next) return
      state = next
      emit()
    })
  }
}

// export function subscribeNotifications(listener: () => void) {
//   ensureInit()
//   listeners.add(listener)
//   return () => listeners.delete(listener)
// }

export function subscribeNotifications(cb: () => void) {
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
  }
}

export function getNotificationsSnapshot(): NotificationItem[] {
  ensureInit()
  // deletedIds 반영된 "현재 보이는 목록"만 반환
  const deleted = new Set(state.deletedIds)
  return state.items.filter((n) => !deleted.has(n.id))
}

/**
 * ==============
 * Actions (B)
 * ==============
 */
function setState(mutator: (draft: PersistedState) => PersistedState) {
  ensureInit()
  state = mutator(state)
  persist()
  emit()
}

export const notificationsActions = {
  markRead(id: string) {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }))
  },

  markAllRead() {
    setState((prev) => ({
      ...prev,
      items: prev.items.map((n) => ({ ...n, read: true })),
    }))
  },

  remove(id: string) {
    // tombstone으로 저장해서 API merge 시에도 되살아나지 않게 함
    setState((prev) => {
      const deletedSet = new Set(prev.deletedIds)
      deletedSet.add(id)
      return {
        ...prev,
        deletedIds: Array.from(deletedSet),
        items: prev.items.filter((n) => n.id !== id),
      }
    })
  },

  clearAll() {
    setState((prev) => ({
      ...prev,
      items: [],
    }))
  },

  clearAllAndTombstones() {
    // 필요 시 완전 초기화용(디버깅/테스트)
    setState(() => ({ version: 1, items: [], deletedIds: [] }))
  },
}

/**
 * ==============
 * (C) API 대비
 * - 서버에서 알림 목록을 받아서 store에 merge
 * - 로컬 read 유지
 * - 로컬 deletedIds(tombstone) 유지
 * ==============
 */
function normalizeServerItems(items: NotificationItem[]): NotificationItem[] {
  // 서버 데이터가 들어와도 최소 필드 보장
  return items.map((n) => ({
    id: String(n.id),
    type: n.type,
    title: n.title ?? "",
    message: n.message ?? "",
    time: n.time ?? "",
    link: n.link ?? "/notifications",
    read: Boolean(n.read), // 서버 read를 신뢰하고 싶지 않으면 false로 강제할 수도 있음
    createdAt: n.createdAt,
  }))
}

export function mergeServerNotifications(serverItems: NotificationItem[]) {
  const incoming = normalizeServerItems(serverItems)

  setState((prev) => {
    const deletedSet = new Set(prev.deletedIds)

    // 로컬 read 상태를 유지하기 위한 맵
    const localById = new Map(prev.items.map((n) => [n.id, n]))

    // 1) 서버 아이템을 먼저 받아오되, deleted는 제외
    const merged: NotificationItem[] = []
    for (const s of incoming) {
      if (deletedSet.has(s.id)) continue

      const local = localById.get(s.id)
      merged.push({
        ...s,
        // 로컬에서 이미 읽음 처리했다면 유지
        read: local?.read ?? s.read ?? false,
      })
    }

    // 2) 로컬에만 있는 항목(더미/오프라인 생성 등)을 유지하고 싶으면 뒤에 붙임
    //    (원치 않으면 이 블록 제거)
    const incomingIds = new Set(merged.map((n) => n.id))
    for (const local of prev.items) {
      if (deletedSet.has(local.id)) continue
      if (!incomingIds.has(local.id)) merged.push(local)
    }

    return { ...prev, items: merged }
  })
}

/**
 * API 붙일 때 사용할 fetcher 형태 예시:
 * await syncNotifications(async () => await api.getNotifications())
 */
export async function syncNotifications(fetcher: () => Promise<NotificationItem[]>) {
  const server = await fetcher()
  mergeServerNotifications(server)
}