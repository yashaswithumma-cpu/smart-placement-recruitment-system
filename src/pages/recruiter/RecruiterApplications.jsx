import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { openAuthenticatedFile } from '../../api/client'
import { recruiterApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import {
  EmptyState,
  ErrorBanner,
  InfoBanner,
  Loading,
  Modal,
  SuccessBanner,
} from '../../components/Feedback'
import { Badge, Chip, MatchBar, Panel, StatCard } from '../../components/Ui'
import { formatDateTime, formatPackage } from '../../utils/format'
import { RECRUITER_NAV } from '../navigation'

const NEXT_STATUSES = ['APPLIED', 'SHORTLISTED', 'INTERVIEW_SCHEDULED', 'SELECTED', 'REJECTED']
const MODES = ['ONLINE', 'OFFLINE', 'PHONE']

export default function RecruiterApplications() {
  const [rows, setRows] = useState([])
  const [drives, setDrives] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')
  const [status, setStatus] = useState('')
  const [driveId, setDriveId] = useState('')
  const [decision, setDecision] = useState(null)
  const [nextStatus, setNextStatus] = useState('SHORTLISTED')
  const [remarks, setRemarks] = useState('')
  const [interviewFor, setInterviewFor] = useState(null)
  const [interview, setInterview] = useState({
    scheduledDate: '',
    scheduledTime: '',
    mode: 'ONLINE',
    meetingLink: '',
    location: '',
    round: '',
    notes: '',
  })
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [apps, myDrives] = await Promise.all([
        recruiterApi.applications(),
        recruiterApi.myDrives(),
      ])
      setRows(Array.isArray(apps) ? apps : [])
      setDrives(Array.isArray(myDrives) ? myDrives : [])
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const counts = useMemo(() => {
    const map = Object.fromEntries(NEXT_STATUSES.map((s) => [s, 0]))
    rows.forEach((row) => {
      if (row.status in map) map[row.status] += 1
    })
    return map
  }, [rows])

  const visible = useMemo(
    () =>
      rows.filter(
        (row) => (!status || row.status === status) && (!driveId || String(row.driveId) === driveId),
      ),
    [rows, status, driveId],
  )

  const openDecision = (row, suggested) => {
    setDecision(row)
    setNextStatus(suggested)
    setRemarks('')
  }

  const saveDecision = async () => {
    setBusy(true)
    setError(null)
    try {
      await recruiterApi.updateApplicationStatus(decision.id, nextStatus, remarks.trim() || null)
      setMessage(`${decision.studentName} moved to ${nextStatus.replace(/_/g, ' ')}.`)
      setDecision(null)
      await load()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const openInterview = (row) => {
    const start = new Date()
    start.setDate(start.getDate() + 2)
    setInterviewFor(row)
    setInterview({
      scheduledDate: start.toISOString().slice(0, 10),
      scheduledTime: '10:00',
      mode: 'ONLINE',
      meetingLink: '',
      location: '',
      round: '',
      notes: '',
    })
  }

  const saveInterview = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await recruiterApi.scheduleInterview({
        applicationId: interviewFor.id,
        scheduledDate: interview.scheduledDate,
        scheduledTime: interview.scheduledTime,
        mode: interview.mode,
        meetingLink: interview.mode === 'ONLINE' ? interview.meetingLink.trim() || null : null,
        location: interview.mode === 'OFFLINE' ? interview.location.trim() || null : interview.location.trim() || null,
        round: interview.round.trim() || null,
        notes: interview.notes.trim() || null,
      })
      setMessage(`Interview scheduled for ${interviewFor.studentName}.`)
      setInterviewFor(null)
      await load()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  return (
    <DashboardLayout nav={RECRUITER_NAV}>
      <PageHead
        title="Applications"
        subtitle="Review every applicant, move them through the pipeline and schedule interviews."
        actions={<Link to="/recruiter/candidates" className="btn btn--secondary">Candidate list</Link>}
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />
      <SuccessBanner message={message} onDismiss={() => setMessage('')} />

      <div className="stat-grid stat-grid--compact">
        <StatCard label="Total" value={rows.length} />
        <StatCard label="Shortlisted" value={counts.SHORTLISTED} />
        <StatCard label="Interviews" value={counts.INTERVIEW_SCHEDULED} />
        <StatCard label="Selected" value={counts.SELECTED} />
        <StatCard label="Rejected" value={counts.REJECTED} />
      </div>

      <Panel
        title="Applicant pipeline"
        actions={
          <>
            <select value={driveId} onChange={(e) => setDriveId(e.target.value)} aria-label="Filter by job">
              <option value="">All jobs</option>
              {drives.map((job) => (
                <option key={job.id} value={job.id}>{job.jobRole}</option>
              ))}
            </select>
            <select value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Filter by status">
              <option value="">All statuses</option>
              {NEXT_STATUSES.map((s) => (
                <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </>
        }
      >
        {loading && <Loading label="Loading applications..." />}

        {!loading && visible.length === 0 && (
          <EmptyState
            icon="📄"
            title="No applications to show"
            message="Applications arrive here once students apply to your approved job posts."
          />
        )}

        {!loading && visible.length > 0 && (
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>Candidate</th>
                  <th>Role</th>
                  <th>CGPA</th>
                  <th>Match</th>
                  <th>Status</th>
                  <th>Applied</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <strong>{row.studentName}</strong>
                      <div className="small muted">{row.branch || '-'}</div>
                    </td>
                    <td>
                      {row.jobRole}
                      <div className="small muted">{formatPackage(row.packageLpa)}</div>
                    </td>
                    <td>{row.cgpa ?? '-'}</td>
                    <td style={{ minWidth: 140 }}><MatchBar value={row.matchPercentage} /></td>
                    <td><Badge>{row.status}</Badge></td>
                    <td>{formatDateTime(row.appliedAt)}</td>
                    <td>
                      <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
                        <button
                          type="button"
                          className="btn btn--secondary btn--sm"
                          onClick={() => openDecision(row, 'SHORTLISTED')}
                        >
                          Update
                        </button>
                        {row.status === 'SHORTLISTED' && (
                          <button
                            type="button"
                            className="btn btn--primary btn--sm"
                            onClick={() => openInterview(row)}
                          >
                            Interview
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      {decision && (
        <Modal
          title={`Update — ${decision.studentName}`}
          onClose={() => !busy && setDecision(null)}
          footer={
            <>
              <button
                type="button"
                className="btn btn--primary"
                onClick={saveDecision}
                disabled={busy}
              >
                {busy ? 'Saving...' : 'Update status'}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setDecision(null)}
                disabled={busy}
              >
                Cancel
              </button>
            </>
          }
        >
          <div className="stack">
            <div className="row" style={{ gap: 6, flexWrap: 'wrap' }}>
              <Badge>{decision.status}</Badge>
              <Badge tone="slate">{decision.jobRole}</Badge>
            </div>

            <div>
              <h3>Match</h3>
              <MatchBar value={decision.matchPercentage} />
              <div className="row" style={{ gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {(decision.matchedSkillsList || []).map((skill) => (
                  <Chip key={skill} tone="green">{skill}</Chip>
                ))}
                {(decision.missingSkillsList || []).map((skill) => (
                  <Chip key={skill} tone="amber">{skill}</Chip>
                ))}
              </div>
            </div>

            {decision.coverNote && (
              <div>
                <h3>Candidate cover note</h3>
                <p>{decision.coverNote}</p>
              </div>
            )}

            <div className="field">
              <label htmlFor="next-status">New status</label>
              <select
                id="next-status"
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value)}
              >
                {NEXT_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
            </div>

            <div className="field">
              <label htmlFor="remarks">Remarks (shared with the student)</label>
              <textarea
                id="remarks"
                value={remarks}
                maxLength={500}
                onChange={(e) => setRemarks(e.target.value)}
                placeholder="Optional note about this decision"
              />
            </div>

            <InfoBanner>
              Setting a status to Selected or Rejected notifies the student automatically.
            </InfoBanner>
          </div>
        </Modal>
      )}

      {interviewFor && (
        <Modal
          title={`Schedule interview — ${interviewFor.studentName}`}
          onClose={() => !busy && setInterviewFor(null)}
          wide
          footer={
            <>
              <button type="submit" form="interview-form" className="btn btn--primary" disabled={busy}>
                {busy ? 'Scheduling...' : 'Schedule interview'}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setInterviewFor(null)}
                disabled={busy}
              >
                Cancel
              </button>
            </>
          }
        >
          <form id="interview-form" onSubmit={saveInterview}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="i-date">Date *</label>
                <input
                  id="i-date"
                  type="date"
                  value={interview.scheduledDate}
                  onChange={(e) => setInterview({ ...interview, scheduledDate: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="i-time">Time *</label>
                <input
                  id="i-time"
                  type="time"
                  value={interview.scheduledTime}
                  onChange={(e) => setInterview({ ...interview, scheduledTime: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="i-mode">Mode *</label>
                <select
                  id="i-mode"
                  value={interview.mode}
                  onChange={(e) => setInterview({ ...interview, mode: e.target.value })}
                >
                  {MODES.map((m) => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label htmlFor="i-round">Round</label>
                <input
                  id="i-round"
                  value={interview.round}
                  maxLength={200}
                  placeholder="Round 1"
                  onChange={(e) => setInterview({ ...interview, round: e.target.value })}
                />
              </div>
              {interview.mode === 'ONLINE' && (
                <div className="field field--full">
                  <label htmlFor="i-link">Meeting link</label>
                  <input
                    id="i-link"
                    value={interview.meetingLink}
                    placeholder="https://meet.example.com/..."
                    onChange={(e) => setInterview({ ...interview, meetingLink: e.target.value })}
                  />
                  <span className="field__hint">Optional, but shared with the student if set.</span>
                </div>
              )}
              <div className="field field--full">
                <label htmlFor="i-location">Location</label>
                <input
                  id="i-location"
                  value={interview.location}
                  placeholder="Campus block, room number or city"
                  onChange={(e) => setInterview({ ...interview, location: e.target.value })}
                />
              </div>
              <div className="field field--full">
                <label htmlFor="i-notes">Notes for the candidate</label>
                <textarea
                  id="i-notes"
                  value={interview.notes}
                  maxLength={1000}
                  onChange={(e) => setInterview({ ...interview, notes: e.target.value })}
                />
              </div>
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  )
}
