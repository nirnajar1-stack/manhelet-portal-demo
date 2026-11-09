import { Check } from 'lucide-react'
import {
  Bar,
  Collapse,
  Stage,
  Text,
  Window,
  type Act,
} from '../kit'
import '../look-manhelet.css'
import './RehabTaskSelectorDemo.css'

/**
 * Gold: form-error (form beats) + share (progressive disclosure).
 * Story: new task → rehab affiliation → goal → stage → primary tag → create.
 * Real strings: title, affiliation, goal, stage, tag, submit.
 */

type S = {
  affiliation: 'ops' | 'rehab'
  goalHover: boolean
  goalPicked: boolean
  stageHover: boolean
  stagePicked: boolean
  done: boolean
}

const initial: S = {
  affiliation: 'ops',
  goalHover: false,
  goalPicked: false,
  stageHover: false,
  stagePicked: false,
  done: false,
}

const poster: S = {
  affiliation: 'rehab',
  goalHover: false,
  goalPicked: true,
  stageHover: false,
  stagePicked: true,
  done: true,
}

const GOAL = 'השתלבות בתעסוקה'
const STAGE = 'בניית תוכנית תעסוקתית'
const REST = { at: 'rest', x: 0.5, y: 0.55 }

async function script(a: Act<S>) {
  await a.wait(700)

  a.mark('affiliate')
  await a.move({ at: 'rehab', x: 0.55, y: 0.55 })
  await a.wait(300)
  await a.click()
  await a.set({ affiliation: 'rehab' })
  await a.wait(700)

  a.mark('goal')
  await a.move({ at: 'goal', x: 0.55, y: 0.55 })
  await a.set({ goalHover: true })
  await a.wait(300)
  await a.click()
  await a.set({ goalPicked: true, goalHover: false })
  await a.wait(650)

  a.mark('stage')
  await a.move({ at: 'stage', x: 0.55, y: 0.55 })
  await a.set({ stageHover: true })
  await a.wait(300)
  await a.click()
  await a.set({ stagePicked: true, stageHover: false })
  await a.wait(800)

  a.mark('submit')
  await a.move({ at: 'submit', x: 0.55, y: 0.55 })
  await a.wait(300)
  await a.click()
  await a.set({ done: true })
  await a.move(REST)
  await a.wait(2000)

  a.mark('reset')
  await a.set({
    affiliation: 'ops',
    goalPicked: false,
    stagePicked: false,
    done: false,
  })
  await a.wait(500)
  await a.move(REST)
  await a.wait(400)
}

export function RehabTaskSelectorDemo() {
  return (
    <Stage
      width={720}
      height={420}
      compact={{ below: 560, width: 420, height: 400 }}
      accent="#f5c542"
      greys="cool"
      initial={initial}
      poster={poster}
      script={script}
      cursor={{ at: REST }}
      className="look-manhelet mh-task"
    >
      {(s) => (
        <Window
          className="mh-task-win"
          title="משימה חדשה"
          body={{ className: 'mh-task-body', 'data-crop': true }}
        >
          <div className="mh-task-title">פתיחת משימה</div>

          <div className="mh-task-group">
            <div className="mh-task-label">כותרת</div>
            <div className="mh-task-field">
              <Text>ליווי לראיון עבודה</Text>
            </div>
          </div>

          <div className="mh-task-group">
            <div className="mh-task-label">בן/בת משפחה</div>
            <div className="mh-task-field">
              <Text>דניאל מזרחי</Text>
            </div>
          </div>

          <div className="mh-task-group">
            <div className="mh-task-label">סוג פעילות</div>
            <div className="mh-seg">
              <span
                className="mh-seg__item"
                data-active={s.affiliation === 'ops' || undefined}
                data-target="ops"
              >
                פעילות שוטפת
              </span>
              <span
                className="mh-seg__item"
                data-active={s.affiliation === 'rehab' || undefined}
                data-target="rehab"
                data-cursor="pointer"
              >
                פעילות שיקומית
              </span>
            </div>
          </div>

          <Collapse open={s.affiliation === 'rehab'}>
            <div className="mh-task-group">
              <div className="mh-task-label">שיוך לשלב שיקום</div>

              <Collapse open={s.stagePicked}>
                <div className="mh-tags">
                  <span className="mh-tag" data-target="tag">
                    <span className="mh-tag__kind">ראשי</span>
                    {GOAL} / {STAGE}
                  </span>
                </div>
              </Collapse>

              <Collapse open={!s.stagePicked}>
                <div className="mh-selector" data-crop>
                  <div className="mh-selector__head">בחירת מטרה ושלב</div>
                  <div className="mh-selector__goals">
                    <div
                      className="mh-goal"
                      data-target="goal"
                      data-cursor="pointer"
                      data-hover={s.goalHover || undefined}
                      data-active={s.goalPicked || undefined}
                    >
                      <Text>{GOAL}</Text>
                    </div>
                    <div className="mh-goal">
                      <Bar w={96} h={5} tone={2} />
                    </div>
                  </div>

                  <Collapse open={s.goalPicked}>
                    <div className="mh-selector__stages">
                      <div
                        className="mh-stage"
                        data-target="stage"
                        data-cursor="pointer"
                        data-hover={s.stageHover || undefined}
                        data-picked={s.stagePicked || undefined}
                      >
                        <Text>{STAGE}</Text>
                        <span className="mh-stage__hint">פעיל</span>
                      </div>
                      <div className="mh-stage">
                        <Bar w={84} h={5} tone={2} />
                        <Bar w={28} h={5} tone={2} />
                      </div>
                    </div>
                  </Collapse>
                </div>
              </Collapse>
            </div>
          </Collapse>

          <div className="mh-task-spacer" />

          <span
            className="mh-task-submit"
            data-target="submit"
            data-cursor="pointer"
            data-done={s.done || undefined}
          >
            {s.done ? (
              <>
                <Check size={14} strokeWidth={2.5} className="mh-task-done-check" />
                המשימה נוצרה
              </>
            ) : (
              'יצירת משימה'
            )}
          </span>

          <span
            data-target="rest"
            style={{
              position: 'absolute',
              left: 28,
              bottom: 20,
              width: 8,
              height: 8,
            }}
          />
        </Window>
      )}
    </Stage>
  )
}

export default RehabTaskSelectorDemo
