import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { adminApi } from '../../api/endpoints'
import DashboardLayout, { PageHead } from '../../components/DashboardLayout'
import { EmptyState, ErrorBanner, Loading, Modal, SuccessBanner } from '../../components/Feedback'
import { Badge, KeyValue, Panel } from '../../components/Ui'
import TagInput from '../../components/TagInput'
import { formatDateTime } from '../../utils/format'
import { ADMIN_NAV } from '../navigation'

export default function AdminStudents() {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [message, setMessage] = useState('')
  const [search, setSearch] = useState('')
  const [branch, setBranch] = useState('')
  const [onlyIncomplete, setOnlyIncomplete] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [busy, setBusy] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setRows(await adminApi.students())
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const branches = useMemo(
    () => [...new Set(rows.map((r) => r.branch).filter(Boolean))].sort(),
    [rows],
  )

  const visible = useMemo(() => {
    const term = search.trim().toLowerCase()
    return rows.filter((row) => {
      const matchesSearch =
        !term ||
        row.name?.toLowerCase().includes(term) ||
        row.email?.toLowerCase().includes(term) ||
        row.rollNumber?.toLowerCase().includes(term)
      const matchesBranch = !branch || row.branch === branch
      const matchesComplete = !onlyIncomplete || !row.profileCompleted
      return matchesSearch && matchesBranch && matchesComplete
    })
  }, [rows, search, branch, onlyIncomplete])

  const openEdit = (row) => {
    setEditing(row)
    setForm({
      name: row.name || '',
      phone: row.phone || '',
      branch: row.branch || '',
      cgpa: row.cgpa ?? '',
      graduationYear: row.graduationYear ?? '',
      rollNumber: row.rollNumber || '',
      linkedInUrl: row.linkedInUrl || '',
      skills: row.skillsCsv || '',
      interests: row.interestsCsv || '',
    })
  }

  const save = async (event) => {
    event.preventDefault()
    setBusy(true)
    setError(null)
    try {
      await adminApi.updateStudent(editing.id, {
        name: form.name.trim(),
        phone: form.phone.trim() || null,
        branch: form.branch.trim() || null,
        cgpa: form.cgpa === '' ? null : Number(form.cgpa),
        graduationYear: form.graduationYear === '' ? null : Number(form.graduationYear),
        rollNumber: form.rollNumber.trim() || null,
        linkedInUrl: form.linkedInUrl.trim() || null,
        skills: form.skills.trim(),
        interests: form.interests.trim(),
      })
      setMessage(`Updated ${form.name}.`)
      setEditing(null)
      await load()
    } catch (err) {
      setError(err)
    } finally {
      setBusy(false)
    }
  }

  const toggleActive = async (row) => {
    setError(null)
    try {
      await adminApi.setStudentActive(row.id, !row.active)
      setMessage(`${row.name} ${row.active ? 'deactivated' : 'reactivated'}.`)
      await load()
    } catch (err) {
      setError(err)
    }
  }

  return (
    <DashboardLayout nav={ADMIN_NAV}>
      <PageHead
        title="Students"
        subtitle="Edit academic records, review profile completeness and control login access."
        actions={<Link to="/admin/reports" className="btn btn--secondary">Export CSV</Link>}
      />

      <ErrorBanner error={error} onDismiss={() => setError(null)} />
      <SuccessBanner message={message} onDismiss={() => setMessage('')} />

      <Panel title="Filters">
        <div className="form-grid form-grid--filters">
          <div className="field">
            <label htmlFor="s-search">Search</label>
            <input
              id="s-search"
              value={search}
              placeholder="Name, email or roll number"
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="s-branch">Branch</label>
            <select id="s-branch" value={branch} onChange={(e) => setBranch(e.target.value)}>
              <option value="">All branches</option>
              {branches.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>
          <div className="field">
            <label className="check-inline">
              <input
                type="checkbox"
                checked={onlyIncomplete}
                onChange={(e) => setOnlyIncomplete(e.target.checked)}
              />
              Incomplete profiles only
            </label>
          </div>
        </div>
        <p className="small muted">{visible.length} student(s)</p>
      </Panel>

      {loading && <Loading label="Loading students..." />}

      {!loading && visible.length === 0 && (
        <EmptyState icon="🎓" title="No students match these filters" />
      )}

      {!loading && visible.length > 0 && (
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Student</th>
                <th>Branch</th>
                <th>CGPA</th>
                <th>Year</th>
                <th>Profile</th>
                <th>Resume</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                    <div className="small muted">{row.email}</div>
                  </td>
                  <td>{row.branch || '-'}</td>
                  <td>{row.cgpa ?? '-'}</td>
                  <td>{row.graduationYear || '-'}</td>
                  <td>
                    <Badge tone={row.profileCompleted ? 'green' : 'amber'}>
                      {row.profileCompleted ? 'Complete' : 'Incomplete'}
                    </Badge>
                  </td>
                  <td>{row.resumeUploaded ? 'Yes' : '-'}</td>
                  <td>
                    <Badge tone={row.active ? 'green' : 'slate'}>
                      {row.active ? 'Active' : 'Deactivated'}
                    </Badge>
                  </td>
                  <td>
                    <div className="row" style={{ gap: 6 }}>
                      <button
                        type="button"
                        className="btn btn--secondary btn--sm"
                        onClick={() => openEdit(row)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className={`btn btn--sm ${row.active ? 'btn--danger' : 'btn--secondary'}`}
                        onClick={() => toggleActive(row)}
                      >
                        {row.active ? 'Disable' : 'Enable'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal
          title={`Edit student — ${editing.name}`}
          onClose={() => !busy && setEditing(null)}
          wide
          footer={
            <>
              <button type="submit" form="student-form" className="btn btn--primary" disabled={busy}>
                {busy ? 'Saving...' : 'Save changes'}
              </button>
              <button
                type="button"
                className="btn btn--secondary"
                onClick={() => setEditing(null)}
                disabled={busy}
              >
                Cancel
              </button>
            </>
          }
        >
          <form id="student-form" onSubmit={save}>
            <div className="form-grid">
              <div className="field">
                <label htmlFor="a-name">Name</label>
                <input
                  id="a-name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="a-roll">Roll number</label>
                <input
                  id="a-roll"
                  value={form.rollNumber}
                  onChange={(e) => setForm({ ...form, rollNumber: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="a-phone">Phone</label>
                <input
                  id="a-phone"
                  value={form.phone}
                  maxLength={10}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="a-branch">Branch</label>
                <input
                  id="a-branch"
                  value={form.branch}
                  onChange={(e) => setForm({ ...form, branch: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="a-cgpa">CGPA</label>
                <input
                  id="a-cgpa"
                  type="number"
                  step="0.01"
                  min="0"
                  max="10"
                  value={form.cgpa}
                  onChange={(e) => setForm({ ...form, cgpa: e.target.value })}
                />
              </div>
              <div className="field">
                <label htmlFor="a-year">Graduation year</label>
                <input
                  id="a-year"
                  type="number"
                  min="2000"
                  max="2100"
                  value={form.graduationYear}
                  onChange={(e) => setForm({ ...form, graduationYear: e.target.value })}
                />
              </div>
              <div className="field field--full">
                <label htmlFor="a-linkedin">LinkedIn URL</label>
                <input
                  id="a-linkedin"
                  value={form.linkedInUrl}
                  onChange={(e) => setForm({ ...form, linkedInUrl: e.target.value })}
                />
              </div>
              <div className="field field--full">
                <TagInput
                  label="Skills"
                  value={form.skills}
                  onChange={(value) => setForm({ ...form, skills: value })}
                />
              </div>
              <div className="field field--full">
                <TagInput
                  label="Interests"
                  value={form.interests}
                  onChange={(value) => setForm({ ...form, interests: value })}
                />
              </div>
            </div>

            <div className="kv-grid">
              <KeyValue label="Applications" value={editing.applicationCount} />
              <KeyValue label="Placement" value={editing.placementStatus || 'NOT_PLACED'} />
              <KeyValue label="Registered" value={formatDateTime(editing.createdAt)} />
            </div>
          </form>
        </Modal>
      )}
    </DashboardLayout>
  )
}
