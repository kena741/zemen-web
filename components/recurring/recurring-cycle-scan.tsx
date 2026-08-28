"use client";

import { useEffect } from "react";

import { scanRecurringCycleDue } from "@/services/recurring/recurringApi";

export function RecurringCycleScan() {
	useEffect(() => {
		void scanRecurringCycleDue();
	}, []);
	return null;
}
