import { Link } from 'react-router-dom'
import { HomeAttentionDemo } from './demos/HomeAttentionDemo'
import { RehabObservationDemo } from './demos/RehabObservationDemo'
import { RehabTaskSelectorDemo } from './demos/RehabTaskSelectorDemo'
import './StageshowPage.css'

const DEMOS = [
  {
    id: 'home-attention',
    title: 'טיפול מיידי מהבית',
    lede: 'מסך הבית → משימה דורשת טיפול → שיוך למלווה',
    Demo: HomeAttentionDemo,
  },
  {
    id: 'rehab-observation',
    title: 'תצפית בשלב שיקום',
    lede: 'תיק יחידה → תהליך השיקום → שלב פעיל → פרסום תצפית',
    Demo: RehabObservationDemo,
  },
  {
    id: 'rehab-task',
    title: 'משימה כפעילות שיקומית',
    lede: 'משימה חדשה → פעילות שיקומית → מטרה ושלב → יצירה',
    Demo: RehabTaskSelectorDemo,
  },
] as const

/**
 * Marketing / demo surface for Stageshow product walkthroughs.
 * Capture a single demo with `?capture=<id>` for film.mjs.
 */
export function StageshowPage() {
  const params = new URLSearchParams(window.location.search)
  const capture = params.get('capture')
  const alone = DEMOS.find((d) => d.id === capture)

  if (alone) {
    const { Demo } = alone
    return (
      <div className="ss-page ss-page--capture" dir="rtl" data-demo={alone.id}>
        <div className="ss-page__capture" id="example">
          <Demo />
        </div>
      </div>
    )
  }

  return (
    <div className="ss-page" dir="rtl">
      <header className="ss-page__hero">
        <p className="ss-page__eyebrow">
          <Link to="/">← חזרה לפורטל</Link>
        </p>
        <h1 className="ss-page__brand">מנהלת</h1>
        <p className="ss-page__headline">איך נראית העבודה בפורטל</p>
        <p className="ss-page__sub">
          שלושה סיפורי מוצר קצרים — משימות, שיקום ותצפיות — בסגנון הפורטל.
        </p>
      </header>

      <div className="ss-page__grid">
        {DEMOS.map(({ id, title, lede, Demo }) => (
          <section key={id} className="ss-page__section" id={id} data-demo={id}>
            <div className="ss-page__copy">
              <h2 className="ss-page__title">{title}</h2>
              <p className="ss-page__lede">{lede}</p>
            </div>
            <div className="ss-page__stage" id={`example-${id}`}>
              <Demo />
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}

export default StageshowPage
