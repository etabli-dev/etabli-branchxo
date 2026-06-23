import React from 'react';
import { useAppStore, ViewKey } from '../state';
import { SegmentedControl } from '../ui';

const OPTIONS: readonly { value: ViewKey; label: string }[] = [
  { value: 'board', label: 'Board' },
  { value: 'timeline', label: 'Timeline' },
  { value: 'tree', label: 'Multiverse' },
  { value: 'heat', label: 'Heat' },
];

export function ViewSwitcher() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  return <SegmentedControl options={OPTIONS} value={view} onChange={setView} />;
}
