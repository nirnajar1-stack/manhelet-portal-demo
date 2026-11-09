import {
  CheckSquare,
  Home,
  Users,
  CalendarDays,
  BookOpen,
} from 'lucide-react'
import {
  Avatar,
  Bar,
  Collapse,
  Stage,
  Text,
  Window,
  type Act,
  type Layout,
} from '../kit'
import '../look-manhelet.css'
import './HomeAttentionDemo.css'

/**
 * Gold: linear (list + assign action).
 * Story: Matam home → attention task → inline assign → toast.
 * Real strings: greeting, attention count, focal task, assign action, toast.
 */

type S = {
  focus: boolean
  menu: boolean
  hoverAssign: boolean
  assigned: boolean
  toast: boolean
}

const initial: S = {
  focus: false,
  menu: false,
  hoverAssign: false,
  assigned: false,
  toast: false,
}

const poster: S = {
  focus: true,
  menu: false,
  hoverAssign: false,
  assigned: true,
  toast: true,
}

const REST = { at: 'rest', x: 0.5, y: 0.5 }
const TASK = 'תיאום ביקור בית — משפחת מזרחי'
const FAMILY = 'משפחת מזרחי · SLA חורג'

async function script(a: Act<S>) {
  await a.wait(800)

  a.mark('focus')
  await a.move({ at: 'row', x: 0.55, y: 0.55 })
  await a.set({ focus: true })
  await a.wait(700)

  a.mark('open')
  await a.click()
  await a.set({ menu: true })
  await a.wait(700)

  a.mark('pick')
  await a.move({ at: 'assign', x: 0.55, y: 0.55 })
  await a.set({ hoverAssign: true })
  await a.wait(350)
  await a.click()
  await a.set({ menu: false, assigned: true, toast: true })
  await a.move({ at: 'rest', x: 0.4, y: 0.55 })
  await a.wait(2200)

  a.mark('reset')
  await a.set({ toast: false })
  await a.wait(350)
  await a.set({ assigned: false })
  await a.wait(300)
  await a.snap({ focus: false, hoverAssign: false })
  await a.move(REST)
  await a.wait(700)
}

function Nav({ compact }: { compact: boolean }) {
  const rows: { Icon: typeof Home; label?: string; w?: number; active?: boolean }[] = [
    { Icon: Home, label: 'סביבת העבודה', active: true },
    { Icon: CheckSquare, label: compact ? undefined : 'מרכז המשימות', w: 72 },
    { Icon: Users, label: compact ? undefined : 'משפחות', w: 48 },
    { Icon: CalendarDays, w: 56 },
    { Icon: BookOpen, w: 40 },
  ]
  return (
    <div className="mh-nav">
      <div className="mh-nav__brand">
        <span>מנהלת</span>
      </div>
      {rows.map(({ Icon, label, w, active }, i) => (
        <div key={i} className="mh-nav__row" data-active={active || undefined}>
          <Icon size={14} strokeWidth={1.75} className="mh-nav__ico" />
          {label ? <Text>{label}</Text> : <Bar w={w!} h={5} tone={3} />}
        </div>
      ))}
    </div>
  )
}

function Scene({ s, layout }: { s: S; layout: Layout }) {
  const compact = layout === 'compact'
  const lead = (
    <Text className="ss-window__heading" style={{ fontSize: 13 }}>
      סביבת העבודה שלי
    </Text>
  )

  return (
    <>
      <Window
        className="mh-home-win"
        sidebar={<Nav compact={compact} />}
        sidebarWidth={compact ? 56 : 196}
        lead={lead}
        toolbar={
          <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <Bar w={18} h={18} r={9} tone={3} />
            <Bar w={22} h={22} r={11} tone={4} />
          </span>
        }
        body={{ className: 'mh-home-body', 'data-crop': true }}
      >
        <div className="mh-home-head">
          <div className="mh-home-head__copy">
            <div className="mh-home-title">בוקר טוב, נועה</div>
            <div className="mh-home-lede">
              <strong>3</strong> משימות דורשות טיפול מתוך 12 פתוחות
            </div>
          </div>
        </div>

        {!compact && (
          <div className="mh-kpi" data-crop>
            {[
              { v: '12', l: 'משימות פתוחות' },
              { v: '3', l: 'חריגות SLA', warn: true },
              { v: '5', l: 'עדכונים חדשים' },
            ].map((k) => (
              <div key={k.l} className="mh-kpi__cell">
                <span className="mh-kpi__value" data-warn={k.warn || undefined}>
                  {k.v}
                </span>
                <span className="mh-kpi__label">{k.l}</span>
              </div>
            ))}
          </div>
        )}

        <div className="mh-panel">
          <div className="mh-panel__head">
            <span className="mh-panel__title">המשימות ביחידות שלי</span>
            <Bar w={64} h={5} tone={2} />
          </div>
          <div className="mh-tabs">
            <span className="mh-tab" data-active>
              טיפול מיידי <span className="mh-tab__n">3</span>
            </span>
            <span className="mh-tab">
              <Bar w={36} h={5} tone={2} />
            </span>
            <span className="mh-tab">
              <Bar w={42} h={5} tone={2} />
            </span>
          </div>
          <div className="mh-list">
            <div
              className="mh-row"
              data-target="row"
              data-cursor="pointer"
              data-focus={s.focus || undefined}
            >
              <span className="mh-row__dot" />
              <div className="mh-row__meta">
                <span className="mh-row__title">{TASK}</span>
                <span className="mh-row__sub">{FAMILY}</span>
              </div>
              {!compact && <span className="mh-badge">דורש טיפול</span>}
              <span className="mh-who">
                <span
                  className="mh-who__swap"
                  data-assigned={s.assigned || undefined}
                >
                  <span data-layer="empty" className="mh-who__empty" />
                  <Avatar
                    name="יוסי"
                    size={22}
                    tone="accent"
                    data-layer="me"
                    style={{ fontSize: 10 }}
                  />
                </span>
              </span>
            </div>

            <Collapse open={s.menu}>
              <div className="mh-inline" data-crop>
                <button
                  type="button"
                  className="mh-inline__btn"
                  data-target="assign"
                  data-cursor="pointer"
                  data-active={s.hoverAssign || undefined}
                >
                  שיוך ליוסי כהן
                </button>
              </div>
            </Collapse>

            {[
              { title: 160, sub: 90 },
              { title: 130, sub: 70 },
              { title: 148, sub: 84 },
            ].map((r, i) => (
              <div
                key={i}
                className="mh-row"
                data-target={i === 1 ? 'rest' : undefined}
              >
                <span className="mh-row__dot" data-quiet />
                <div className="mh-row__meta">
                  <Bar w={compact ? Math.min(r.title, 110) : r.title} h={6} tone={3} />
                  <Bar w={r.sub} h={5} tone={2} />
                </div>
                {!compact && <Bar w={52} h={16} r={6} tone={2} />}
                <Bar w={22} h={22} r={11} tone={2} style={{ justifySelf: 'end' }} />
              </div>
            ))}
          </div>
        </div>
      </Window>

      <div className="mh-toast" data-target="toast" data-show={s.toast || undefined}>
        המשימה שויכה ליוסי כהן
      </div>
    </>
  )
}

export function HomeAttentionDemo() {
  return (
    <Stage
      width={920}
      height={470}
      compact={{ below: 600, width: 420, height: 360 }}
      accent="#f5c542"
      greys="cool"
      initial={initial}
      poster={poster}
      script={script}
      cursor={{ at: REST }}
      className="look-manhelet mh-home"
    >
      {(s, _rect, layout) => <Scene s={s} layout={layout} />}
    </Stage>
  )
}

export default HomeAttentionDemo
