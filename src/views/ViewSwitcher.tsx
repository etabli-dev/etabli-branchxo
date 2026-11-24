import React from 'react';
import { useStrings } from '../i18n';
import { useAppStore, ViewKey } from '../state';
import { SegmentedControl } from '../ui';

const KEYS: readonly ViewKey[] = ['board', 'timeline', 'tree', 'heat'];

export function ViewSwitcher() {
  const view = useAppStore((s) => s.view);
  const setView = useAppStore((s) => s.setView);
  const t = useStrings();
  const options = KEYS.map((value) => ({
    value,
    label: t.views[value].short,
    accessibilityLabel: t.views[value].full,
  }));
  return <SegmentedControl options={options} value={view} onChange={setView} testID="view" />;
}
