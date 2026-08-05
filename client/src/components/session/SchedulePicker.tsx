import { useState } from 'react';
import toast from 'react-hot-toast';
import { proposeSchedule, confirmSchedule, downloadICS, reportNoShow } from '../../services/session.service';
import { getApiError } from '../../types/api.types';
import Button from '../ui/Button';

interface SchedulePickerProps {
  connectionId: string;
}

export default function SchedulePicker({ connectionId }: SchedulePickerProps) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [proposing, setProposing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [noShowReason, setNoShowReason] = useState('');
  const [showNoShow, setShowNoShow] = useState(false);

  async function handlePropose() {
    if (!date || !time) {
      toast.error('Select a date and time');
      return;
    }
    setProposing(true);
    try {
      await proposeSchedule(connectionId, `${date}T${time}`);
      toast.success('Session time proposed!');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setProposing(false);
    }
  }

  async function handleConfirm() {
    setConfirming(true);
    try {
      await confirmSchedule(connectionId);
      toast.success('Session confirmed!');
    } catch (err) {
      toast.error(getApiError(err));
    } finally {
      setConfirming(false);
    }
  }

  async function handleDownloadICS() {
    try {
      await downloadICS(connectionId);
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  async function handleNoShow() {
    try {
      await reportNoShow(connectionId, noShowReason || undefined);
      toast.success('No-show reported');
      setShowNoShow(false);
      setNoShowReason('');
    } catch (err) {
      toast.error(getApiError(err));
    }
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <h4 className="text-sm font-semibold text-gray-900">Schedule Session</h4>

      <div className="mt-3 flex gap-2">
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          min={new Date().toISOString().split('T')[0]}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <input
          type="time"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          className="rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
        />
        <Button size="sm" loading={proposing} onClick={handlePropose}>
          Propose
        </Button>
      </div>

      <div className="mt-3 flex gap-2">
        <Button variant="secondary" size="sm" loading={confirming} onClick={handleConfirm}>
          Confirm time
        </Button>
        <Button variant="secondary" size="sm" onClick={handleDownloadICS}>
          Download .ics
        </Button>
      </div>

      <div className="mt-4 border-t border-gray-100 pt-3">
        {!showNoShow ? (
          <button
            type="button"
            onClick={() => setShowNoShow(true)}
            className="text-xs text-red-500 hover:text-red-700"
          >
            Report no-show
          </button>
        ) : (
          <div className="space-y-2">
            <input
              type="text"
              value={noShowReason}
              onChange={(e) => setNoShowReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full rounded-md border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:outline-none"
            />
            <div className="flex gap-2">
              <Button variant="danger" size="sm" onClick={handleNoShow}>
                Submit
              </Button>
              <Button variant="secondary" size="sm" onClick={() => setShowNoShow(false)}>
                Cancel
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
