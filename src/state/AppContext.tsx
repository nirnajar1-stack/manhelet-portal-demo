import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  closeTaskWithDocumentation,
  createTask,
  fetchChatter,
  fetchTask,
  fetchTasks,
  postChatter,
  setTaskNeedsAttention,
  updateTaskStatus,
} from '@/api/stubs'
import { canChangeTaskStatus, canCloseTask, canPostInternalChatter } from '@/lib/access'
import { users } from '@/data/mock'
import type {
  ChatterMessage,
  ChatterVisibility,
  Task,
  TaskStatus,
  User,
  UserRole,
} from '@/types'

interface AppState {
  currentUser: User
  setRole: (role: UserRole) => void
  switchUser: (userId: string) => void
  tasks: Task[]
  refreshTasks: () => Promise<void>
  getTask: (id: string) => Promise<Task | undefined>
  changeStatus: (taskId: string, status: TaskStatus) => Promise<void>
  toggleNeedsAttention: (taskId: string, value: boolean) => Promise<void>
  closeTask: (taskId: string, documentation: string) => Promise<boolean>
  addChatter: (
    taskId: string,
    body: string,
    visibility: ChatterVisibility,
  ) => Promise<void>
  loadChatter: (taskId: string) => Promise<ChatterMessage[]>
  createNewTask: Parameters<typeof createTask>[0] extends infer T
    ? (input: T) => Promise<Task>
    : never
  searchQuery: string
  setSearchQuery: (q: string) => void
  toast: string | null
  showToast: (msg: string) => void
}

const AppContext = createContext<AppState | null>(null)

const roleDefaultUser: Record<UserRole, string> = {
  matam: 'u-nir',
  molecule: 'u-dana',
  family: 'u-family-cohen',
}

const USER_STORAGE_KEY = 'manhelet-portal-demo-user'

function readStoredUser(): User {
  try {
    const id = sessionStorage.getItem(USER_STORAGE_KEY)
    const u = users.find((x) => x.id === id)
    if (u) return u
  } catch {
    /* ignore */
  }
  return users[0]
}

function persistUser(user: User) {
  try {
    sessionStorage.setItem(USER_STORAGE_KEY, user.id)
  } catch {
    /* ignore */
  }
}

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User>(() => readStoredUser())
  const [tasks, setTasks] = useState<Task[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [toast, setToast] = useState<string | null>(null)

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2800)
  }, [])

  const refreshTasks = useCallback(async () => {
    setTasks(await fetchTasks())
  }, [])

  const setRole = useCallback((role: UserRole) => {
    const u = users.find((x) => x.id === roleDefaultUser[role])
    if (u) {
      setCurrentUser(u)
      persistUser(u)
    }
  }, [])

  const switchUser = useCallback((userId: string) => {
    const u = users.find((x) => x.id === userId)
    if (u) {
      setCurrentUser(u)
      persistUser(u)
    }
  }, [])

  const getTask = useCallback(async (id: string) => fetchTask(id), [])

  const changeStatus = useCallback(
    async (taskId: string, status: TaskStatus) => {
      if (!canChangeTaskStatus(currentUser)) {
        showToast('למולקולה אין הרשאה לשנות סטטוס')
        return
      }
      if (status === 'done' || status === 'closed') {
        showToast('לסגירה יש להשתמש בפעולת סגירה עם תיעוד')
        return
      }
      await updateTaskStatus(taskId, status)
      await refreshTasks()
      showToast('הסטטוס עודכן')
    },
    [currentUser, refreshTasks, showToast],
  )

  const toggleNeedsAttention = useCallback(
    async (taskId: string, value: boolean) => {
      if (!canChangeTaskStatus(currentUser)) {
        showToast('למולקולה אין הרשאה לשנות סימון טיפול')
        return
      }
      await setTaskNeedsAttention(taskId, value)
      await refreshTasks()
      showToast(value ? 'סומן כדורש טיפול' : 'הוסר סימון דורש טיפול')
    },
    [currentUser, refreshTasks, showToast],
  )

  const closeTask = useCallback(
    async (taskId: string, documentation: string) => {
      if (!canCloseTask(currentUser)) {
        showToast('למולקולה אין הרשאה לסגור משימה')
        return false
      }
      try {
        await closeTaskWithDocumentation({
          taskId,
          authorId: currentUser.id,
          documentation,
          visibility: 'shared',
        })
        await refreshTasks()
        showToast('המשימה נסגרה עם תיעוד')
        return true
      } catch (err) {
        showToast(err instanceof Error ? err.message : 'סגירה נכשלה')
        return false
      }
    },
    [currentUser, refreshTasks, showToast],
  )

  const addChatter = useCallback(
    async (taskId: string, body: string, visibility: ChatterVisibility) => {
      if (visibility === 'internal' && !canPostInternalChatter(currentUser)) {
        showToast('למולקולה אין הרשאה להודעות פנימיות')
        return
      }
      await postChatter({
        taskId,
        authorId: currentUser.id,
        body,
        visibility,
      })
      await refreshTasks()
      showToast('התגובה נשמרה (דמה)')
    },
    [currentUser, refreshTasks, showToast],
  )

  const loadChatter = useCallback(
    async (taskId: string) => fetchChatter(taskId, currentUser.id),
    [currentUser.id],
  )

  const createNewTask = useCallback(
    async (input: Parameters<typeof createTask>[0]) => {
      const task = await createTask(input)
      await refreshTasks()
      showToast(`משימה ${task.number} נוצרה`)
      return task
    },
    [refreshTasks, showToast],
  )

  const value = useMemo(
    () => ({
      currentUser,
      setRole,
      switchUser,
      tasks,
      refreshTasks,
      getTask,
      changeStatus,
      toggleNeedsAttention,
      closeTask,
      addChatter,
      loadChatter,
      createNewTask,
      searchQuery,
      setSearchQuery,
      toast,
      showToast,
    }),
    [
      currentUser,
      setRole,
      switchUser,
      tasks,
      refreshTasks,
      getTask,
      changeStatus,
      toggleNeedsAttention,
      closeTask,
      addChatter,
      loadChatter,
      createNewTask,
      searchQuery,
      toast,
      showToast,
    ],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within AppProvider')
  return ctx
}
