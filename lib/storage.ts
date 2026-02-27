import AsyncStorage from '@react-native-async-storage/async-storage';
import { ScanResult } from './types';

const SCANS_KEY = '@agroscan_scans';

export async function saveScans(scans: ScanResult[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SCANS_KEY, JSON.stringify(scans));
  } catch (error) {
    console.error('Failed to save scans:', error);
  }
}

export async function loadScans(): Promise<ScanResult[]> {
  try {
    const data = await AsyncStorage.getItem(SCANS_KEY);
    if (!data) return [];
    return JSON.parse(data) as ScanResult[];
  } catch (error) {
    console.error('Failed to load scans:', error);
    return [];
  }
}

export async function addScan(scan: ScanResult): Promise<ScanResult[]> {
  const existing = await loadScans();
  const updated = [scan, ...existing];
  await saveScans(updated);
  return updated;
}

export async function deleteScan(id: string): Promise<ScanResult[]> {
  const existing = await loadScans();
  const updated = existing.filter((s) => s.id !== id);
  await saveScans(updated);
  return updated;
}
