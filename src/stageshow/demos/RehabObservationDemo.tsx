import { CheckSquare, Home, MessageSquarePlus, Users } from 'lucide-react'
import {
  Bar,
  Collapse,
  Stage,
  Text,
  Window,
  type Act,
  type Layout,
} from '../kit'
import '../look-manhelet.css'
import './RehabObservationDemo.css'

/**
 * Gold: notion (composer + typed content) + linear chrome.
 * Story: unit case → rehab stage → add observation → thread updates.
 * Real strings: family, member, stage, observation, CTA.
 */

type S = {
  composer: boolean
  text: string
  typing: boolean
  posted: boolean
}

const initial: S = {
  composer: false,
  text: '',
  typing: false,
  posted: false,
}

const poster: S = {
  composer: false,
  text: '',
  typing: false,
  posted: true,
}

const NOTE =
  'דניאל הגיע בזמן לפגישה עם המעסיק והראה מוטיבציה גבוהה.'

const REST = { at: 'rest', x: 0.5, y: 0.45 }

async function script(a: Act<S>) {
  await a.wait(700)

  a.mark('open')
  await a.move({ at: 'add', x: 0.55, y: 0.55 })
  await a.wait(350)
  await a.click()
  await a.set({ composer: true })
  await a.wait(600)

  a.mark('type')
  await a.click({ at: 'field', x: 0.4, y: 0.5 })
  await a.set({ typing: true })
  await a.type('text', NOTE, { interval: 28 })
  await a.set({ typing: false })
  await a.wait(450)

  a.mark('send')
  await a.move({ at: 'send', x: 0.55, y: 0.55 })
  await a.wait(250)
  await a.click()
  await a.set({ posted: true, composer: false, text: '' })
  await a.move(REST)
  await a.wait(2200)

  a.mark('reset')
  await a.set({ posted: false })
  await a.wait(400)
  await a.move(REST)
  await a.wait(500)
}

function Nav() {
  return (
    <div className="mh-obs-nav">
      <div className="mh-obs-nav__brand">מנהלת</div>
      {[
        { Icon: Home, w: 70 },
        { Icon: CheckSquare, w: 64 },
        { Icon: Users, label: 'משפחות', active: true },
      ].map(({ Icon, w, label, active }, i) => (
        <div key={i} className="mh-obs-nav__row" data-active={active || undefined}>
          <Icon size={14} strokeWidth={1.75} />
          {label ? <Text>{label}</Text> : <Bar w={w!} h={5} tone={3} />}
        </div>
      ))}
    </div>
  )
}

function Scene({ s, layout }: { s: S; layout: Layout }) {
  const compact = layout === 'compact'
  return (
    <Window
      className="mh-obs-win"
      sidebar={<Nav />}
      sidebarWidth={compact ? 52 : 180}
      lead={
        <Text style={{ fontSize: 13, fontWeight: 600, color: '#0d1a33' }}>
          תיק יחידה
        </Text>
      }
      toolbar={
        <span style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <Bar w={18} h={18} r={9} tone={3} />
          <Bar w={22} h={22} r={11} tone={4} />
        </span>
      }
      body={{ className: 'mh-obs-body', 'data-crop': true }}
    >
      <div className="mh-obs-crumb">
        <Text>משפחת מזרחי</Text>
        <span aria-hidden>›</span>
        <strong>דניאל מזרחי</strong>
        <span aria-hidden>›</span>
        <Text>שיקום</Text>
      </div>

      <div className="mh-obs-unit">
        <Bar w={28} h={28} r={14} tone={4} />
        <div>
          <div className="mh-obs-unit__name">דניאל מזרחי</div>
          <Bar w={120} h={5} tone={2} style={{ marginTop: 4 }} />
        </div>
      </div>

      <div className="mh-obs-tabs">
        <span className="mh-obs-tab">
          <Bar w={36} h={5} tone={2} />
        </span>
        <span className="mh-obs-tab" data-active>
          תהליך השיקום
        </span>
        <span className="mh-obs-tab">
          <Bar w={40} h={5} tone={2} />
        </span>
      </div>

      <div className="mh-obs-layout">
        <div className="mh-obs-main">
          <div className="mh-obs-stage-head">
            <div className="mh-obs-stage-name">בניית תוכנית תעסוקתית</div>
            <div className="mh-obs-stage-meta">
              מטרה: השתלבות בתעסוקה · שלב פעיל
            </div>
          </div>

          <div className="mh-obs-actions">
            <span
              className="mh-obs-btn"
              data-primary
              data-target="add"
              data-cursor="pointer"
              data-open={s.composer || undefined}
            >
              <MessageSquarePlus size={13} strokeWidth={2} />
              הוספת תצפית
            </span>
            {!compact && (
              <span className="mh-obs-btn" style={{ width: 72 }} aria-hidden />
            )}
          </div>

          <Collapse open={s.composer}>
            <div
              className="mh-obs-composer"
              data-focus={s.typing || s.composer || undefined}
            >
              <div className="mh-obs-composer__label">תצפית חדשה</div>
              <div
                className="mh-obs-composer__field"
                data-target="field"
                data-cursor="ibeam"
                data-empty={!s.text || undefined}
                data-placeholder="מה ראיתם בשטח?"
              >
                {s.text}
                {s.typing && <span className="ss-caret" />}
              </div>
              <div className="mh-obs-composer__bar">
                <span
                  className="mh-obs-send"
                  data-target="send"
                  data-cursor="pointer"
                  data-disabled={!s.text || undefined}
                >
                  פרסום תצפית
                </span>
              </div>
            </div>
          </Collapse>

          <div className="mh-obs-thread" data-target="rest">
            <Collapse open={s.posted}>
              <div className="mh-obs-card" data-new data-crop>
                <div className="mh-obs-card__who">
                  <Bar w={18} h={18} r={9} tone={4} />
                  <Text>נועה לוי · עכשיו</Text>
                </div>
                <div className="mh-obs-card__body">{NOTE}</div>
              </div>
            </Collapse>
            <div className="mh-obs-card" data-crop>
              <div className="mh-obs-card__who">
                <Bar w={18} h={18} r={9} tone={3} />
                <Bar w={88} h={5} tone={3} />
              </div>
              <Bar w="92%" h={6} tone={2} />
              <Bar w="68%" h={6} tone={2} />
            </div>
            {!compact && (
              <div className="mh-obs-card">
                <div className="mh-obs-card__who">
                  <Bar w={18} h={18} r={9} tone={3} />
                  <Bar w={72} h={5} tone={2} />
                </div>
                <Bar w="80%" h={6} tone={2} />
              </div>
            )}
          </div>
        </div>

        {!compact && (
          <aside className="mh-obs-side">
            <div className="mh-obs-side__label">מטרת שיקום</div>
            <div className="mh-obs-side__goal">השתלבות בתעסוקה</div>
            <div className="mh-obs-side__label" style={{ marginTop: 4 }}>
              שלבים
            </div>
            <div className="mh-obs-steps">
              <div className="mh-obs-step" data-done>
                <span className="mh-obs-step__mark" />
                <Bar w={70} h={5} tone={2} />
              </div>
              <div className="mh-obs-step" data-active>
                <span className="mh-obs-step__mark" />
                <Text>בניית תוכנית</Text>
              </div>
              <div className="mh-obs-step">
                <span className="mh-obs-step__mark" />
                <Bar w={58} h={5} tone={2} />
              </div>
            </div>
          </aside>
        )}
      </div>
    </Window>
  )
}

export function RehabObservationDemo() {
  return (
    <Stage
      width={940}
      height={460}
      compact={{ below: 600, width: 420, height: 380 }}
      accent="#f5c542"
      greys="cool"
      initial={initial}
      poster={poster}
      script={script}
      cursor={{ at: REST }}
      className="look-manhelet mh-obs"
    >
      {(s, _rect, layout) => <Scene s={s} layout={layout} />}
    </Stage>
  )
}

export default RehabObservationDemo
