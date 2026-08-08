'use client';

import { useSyncExternalStore } from 'react';

// Module-level store for the donate drawer's open state. Pages mount a
// single DonateDrawer while rendering any number of DonateButton triggers
// (e.g. StoryPage's mobile summary + desktop sticky card), so the open
// state must live outside both — otherwise each trigger would need its own
// drawer, and ?open=donate would open all of them at once.
let isOpen = false;
const listeners = new Set<() => void>();

const emit = () => {
    for (const listener of listeners) {
        listener();
    }
};

export const openDonateDrawer = () => {
    isOpen = true;
    emit();
};

export const closeDonateDrawer = () => {
    isOpen = false;
    emit();
};

const subscribe = (listener: () => void) => {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
};

/** The drawer is always closed during SSR; it only opens client-side. */
const getServerSnapshot = () => false;

export const useDonateDrawerOpen = () =>
    useSyncExternalStore(subscribe, () => isOpen, getServerSnapshot);
