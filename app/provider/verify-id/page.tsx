"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import {
	CheckCircle2Icon,
	ChevronDownIcon,
	HourglassIcon,
	ImagePlusIcon,
	PencilIcon,
	UploadIcon,
	XIcon,
} from "lucide-react";

import { ProfileBackLink } from "@/components/provider/profile-back-link";
import { useLocale } from "@/lib/i18n";
import { cn } from "@/lib/utils";
import { uploadVerifyDocument } from "@/services/auth/verificationApi";
import {
	fetchDocumentsBySubCategory,
	fetchProviderVerifyDocuments,
	fetchSignupIdentityDocuments,
	resolveVerifyStatus,
	type IdentityDocument,
	type ProviderVerifyDoc,
	type VerifyDocStatus,
} from "@/services/provider/documentsApi";
import { fetchProviderServices } from "@/services/services/servicesApi";
import { useAuth } from "@/store/useAuth";

type SubCategoryOption = { id: string; name: string };

function statusMeta(
	status: VerifyDocStatus,
	t: (key: string) => string,
): { label: string; chip: string; icon: "upload" | "ok" | "pending" | "reject" } {
	switch (status) {
		case "approved":
			return {
				label: t("providerVerifyApproved"),
				chip: "bg-emerald-500/12 text-emerald-700 border-emerald-600/25",
				icon: "ok",
			};
		case "rejected":
			return {
				label: t("providerVerifyRejected"),
				chip: "bg-red-500/12 text-red-700 border-red-600/25",
				icon: "reject",
			};
		case "pending":
			return {
				label: t("providerVerifyPending"),
				chip: "bg-amber-500/14 text-amber-800 border-amber-700/25",
				icon: "pending",
			};
		default:
			return {
				label: t("providerVerifyRequired"),
				chip: "bg-muted text-muted-foreground border-border",
				icon: "upload",
			};
	}
}

function StatusIcon({ kind }: { kind: "upload" | "ok" | "pending" | "reject" }) {
	if (kind === "ok") return <CheckCircle2Icon className="size-4" />;
	if (kind === "reject") return <XIcon className="size-4" />;
	if (kind === "pending") return <HourglassIcon className="size-4" />;
	return <UploadIcon className="size-4" />;
}

function SubCategoryDropdown({
	label,
	options,
	value,
	onChange,
}: {
	label: string;
	options: SubCategoryOption[];
	value: string;
	onChange: (id: string) => void;
}) {
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const selected = options.find((o) => o.id === value) ?? options[0];

	useEffect(() => {
		if (!open) return;
		function onDocClick(e: MouseEvent) {
			if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
		}
		function onKey(e: KeyboardEvent) {
			if (e.key === "Escape") setOpen(false);
		}
		document.addEventListener("mousedown", onDocClick);
		document.addEventListener("keydown", onKey);
		return () => {
			document.removeEventListener("mousedown", onDocClick);
			document.removeEventListener("keydown", onKey);
		};
	}, [open]);

	return (
		<div ref={rootRef} className="relative mt-6">
			<span className="absolute -top-2 left-3 z-20 bg-background px-1 text-[12px] font-medium text-muted-foreground">
				{label}
			</span>
			<button
				type="button"
				aria-haspopup="listbox"
				aria-expanded={open}
				onClick={() => setOpen((v) => !v)}
				className={cn(
					"flex w-full items-center justify-between gap-3 rounded-xl border border-border/80 bg-white px-4 py-3.5 text-left text-[15px] font-medium text-foreground transition-colors duration-150",
					"outline-none focus-visible:ring-2 focus-visible:ring-primary/25",
					open && "ring-2 ring-primary/25",
				)}
			>
				<span className="min-w-0 truncate">{selected?.name ?? label}</span>
				<ChevronDownIcon
					className={cn(
						"size-4 shrink-0 text-muted-foreground transition-transform duration-150",
						open && "rotate-180",
					)}
				/>
			</button>
			{open ? (
				<ul
					role="listbox"
					aria-label={label}
					className="absolute inset-x-0 top-[calc(100%+6px)] z-30 max-h-60 overflow-auto rounded-xl border border-border/80 bg-white py-1.5 shadow-[0_12px_28px_rgba(0,0,0,0.12)]"
				>
					{options.map((o) => {
						const isSelected = o.id === value;
						return (
							<li key={o.id} role="option" aria-selected={isSelected}>
								<button
									type="button"
									className={cn(
										"flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left text-[15px] transition-colors duration-150",
										isSelected
											? "bg-primary/8 font-semibold text-primary"
											: "font-medium text-foreground hover:bg-[#eef3ea]",
									)}
									onClick={() => {
										setOpen(false);
										if (o.id !== value) onChange(o.id);
									}}
								>
									<span className="min-w-0 truncate">{o.name}</span>
									{isSelected ? (
										<CheckCircle2Icon className="size-4 shrink-0 text-primary" />
									) : null}
								</button>
							</li>
						);
					})}
				</ul>
			) : null}
		</div>
	);
}

function ProviderVerifyIdPageInner() {
	const router = useRouter();
	const searchParams = useSearchParams();
	const fromSignup = searchParams.get("signup") === "1";
	const { t } = useLocale();
	const { user } = useAuth();
	const providerId = user?.provider?.id ?? "";

	const [subs, setSubs] = useState<SubCategoryOption[]>([]);
	const [subCategoryId, setSubCategoryId] = useState("");
	const [docs, setDocs] = useState<IdentityDocument[]>([]);
	const [existing, setExisting] = useState<Record<string, ProviderVerifyDoc>>(
		{},
	);
	const [files, setFiles] = useState<Record<string, File | null>>({});
	const [previews, setPreviews] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(true);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [toast, setToast] = useState<string | null>(null);
	const fileRefs = useRef<Record<string, HTMLInputElement | null>>({});

	useEffect(() => {
		return () => {
			for (const url of Object.values(previews)) URL.revokeObjectURL(url);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps -- revoke on unmount only
	}, []);

	useEffect(() => {
		let cancelled = false;
		(async () => {
			setLoading(true);
			setError(null);

			if (providerId) {
				const existingRes = await fetchProviderVerifyDocuments(providerId);
				if (cancelled) return;
				if (existingRes.error) setError(existingRes.error);
				setExisting(existingRes.byDocumentId);
			}

			if (fromSignup) {
				const res = await fetchSignupIdentityDocuments();
				if (cancelled) return;
				if (res.error) setError(res.error);
				setDocs(res.documents);
				setLoading(false);
				return;
			}

			if (!providerId) {
				setLoading(false);
				return;
			}

			const servicesRes = await fetchProviderServices(providerId);
			if (cancelled) return;
			if (servicesRes.error) setError(servicesRes.error);

			const map = new Map<string, string>();
			for (const s of servicesRes.services) {
				const id = s.subCategoryId?.trim();
				if (!id || map.has(id)) continue;
				map.set(id, s.subCategoryName?.trim() || id);
			}
			const options = [...map.entries()].map(([id, name]) => ({ id, name }));
			setSubs(options);

			if (options.length === 0) {
				const res = await fetchSignupIdentityDocuments();
				if (cancelled) return;
				if (res.error) setError(res.error);
				setDocs(res.documents);
				setLoading(false);
				return;
			}

			const firstId = options[0]?.id ?? "";
			setSubCategoryId(firstId);
			const docsRes = await fetchDocumentsBySubCategory(firstId);
			if (cancelled) return;
			if (docsRes.error) setError(docsRes.error);
			setDocs(docsRes.documents);
			setLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [providerId, fromSignup]);

	async function onSubCategoryChange(id: string) {
		setSubCategoryId(id);
		setFiles({});
		setPreviews((prev) => {
			for (const url of Object.values(prev)) URL.revokeObjectURL(url);
			return {};
		});
		setLoading(true);
		const docsRes = await fetchDocumentsBySubCategory(id);
		if (docsRes.error) setError(docsRes.error);
		setDocs(docsRes.documents);
		setLoading(false);
	}

	function pickFile(docId: string, file: File | null) {
		if (!file) return;
		setFiles((prev) => ({ ...prev, [docId]: file }));
		setPreviews((prev) => {
			const next = { ...prev };
			if (next[docId]) URL.revokeObjectURL(next[docId]);
			next[docId] = URL.createObjectURL(file);
			return next;
		});
	}

	function clearLocal(docId: string) {
		setFiles((prev) => {
			const next = { ...prev };
			delete next[docId];
			return next;
		});
		setPreviews((prev) => {
			const next = { ...prev };
			if (next[docId]) URL.revokeObjectURL(next[docId]);
			delete next[docId];
			return next;
		});
	}

	const rows = useMemo(() => {
		return docs.map((doc) => {
			const row = existing[doc.id];
			const localPreview = previews[doc.id];
			const remote = row?.documentImage ?? null;
			const imageSrc = localPreview || remote;
			const hasImage = Boolean(imageSrc);
			const status = resolveVerifyStatus(row?.isVerify ?? null, hasImage);
			const editable =
				!hasImage || row?.isVerify === false || Boolean(files[doc.id]);
			return { doc, imageSrc, hasImage, status, editable };
		});
	}, [docs, existing, previews, files]);

	async function submit() {
		if (!providerId) return;
		const missing = rows.some((r) => !r.hasImage);
		if (missing) {
			setError(t("providerVerifyUploadRequired"));
			return;
		}
		const pending = docs.filter((d) => files[d.id]);
		if (!pending.length) {
			setError(t("providerVerifyUploadNew"));
			return;
		}
		setBusy(true);
		setError(null);
		setToast(null);
		for (const doc of pending) {
			const file = files[doc.id];
			if (!file) continue;
			const r = await uploadVerifyDocument({
				providerId,
				providerName: user?.provider?.fullName ?? user?.name ?? "",
				providerEmail: user?.email ?? "",
				documentId: doc.id,
				file,
				previousImageUrl: existing[doc.id]?.documentImage,
			});
			if (r.error) {
				setError(r.error);
				setBusy(false);
				return;
			}
		}
		const refreshed = await fetchProviderVerifyDocuments(providerId);
		setExisting(refreshed.byDocumentId);
		setFiles({});
		setPreviews((prev) => {
			for (const url of Object.values(prev)) URL.revokeObjectURL(url);
			return {};
		});
		setBusy(false);
		setToast(t("providerVerifySent"));
		if (fromSignup) {
			router.replace("/provider/onboarding");
		}
	}

	const backHref = fromSignup ? "/login" : "/provider/profile";
	const backLabel = fromSignup ? t("signIn") : t("profileTitle");

	return (
		<div className="mx-auto max-w-lg px-4 py-6 pb-28">
			<ProfileBackLink href={backHref} label={backLabel} />
			<h1 className="mt-2 text-[22px] font-bold tracking-tight text-foreground text-balance">
				{t("providerVerifyDocumentsTitle")}
			</h1>
			{fromSignup ? (
				<p className="mt-2 text-[14px] text-muted-foreground">
					{t("providerVerifyHint")}
				</p>
			) : null}

			{error ? (
				<div
					role="alert"
					className="mt-4 rounded-2xl bg-destructive/10 px-4 py-3 text-[14px] text-destructive"
				>
					{error}
				</div>
			) : null}
			{toast ? (
				<div
					role="status"
					className="mt-4 rounded-2xl bg-primary/10 px-4 py-3 text-[14px] text-primary"
				>
					{toast}
				</div>
			) : null}

			{!fromSignup && subs.length > 0 ? (
				<SubCategoryDropdown
					label={t("providerVerifySelectSubCategory")}
					options={subs}
					value={subCategoryId}
					onChange={(id) => void onSubCategoryChange(id)}
				/>
			) : null}

			{!fromSignup && subs.length === 0 && !loading ? (
				<p className="mt-6 text-[14px] text-muted-foreground">
					{t("providerVerifyNoSubCategories")}
				</p>
			) : null}

			<div className="mt-6 space-y-7">
				{loading ? (
					<div className="space-y-4">
						<div className="h-48 animate-pulse rounded-2xl bg-muted/60" />
						<div className="h-48 animate-pulse rounded-2xl bg-muted/60" />
					</div>
				) : (
					rows.map(({ doc, imageSrc, hasImage, status, editable }) => {
						const meta = statusMeta(status, t);
						return (
							<article
								key={doc.id}
								className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-[0_10px_18px_rgba(0,0,0,0.06)]"
							>
								<div className="space-y-2.5 p-3">
									<div className="flex items-start gap-2.5">
										<h2 className="min-w-0 flex-1 text-[16px] font-bold leading-snug text-foreground text-pretty">
											{doc.name}
										</h2>
										<span
											className={cn(
												"inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] font-bold",
												meta.chip,
											)}
										>
											<StatusIcon kind={meta.icon} />
											{meta.label}
										</span>
									</div>
									{doc.description ? (
										<p className="text-[13px] font-medium text-muted-foreground">
											{doc.description}
										</p>
									) : null}

									<div
										className={cn(
											"relative overflow-hidden rounded-[14px] bg-muted/50",
											editable && "cursor-pointer",
										)}
										style={{ minHeight: 180 }}
										onClick={() => {
											if (!editable) return;
											fileRefs.current[doc.id]?.click();
										}}
										onKeyDown={(e) => {
											if (!editable) return;
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												fileRefs.current[doc.id]?.click();
											}
										}}
										role={editable ? "button" : undefined}
										tabIndex={editable ? 0 : undefined}
									>
										<input
											ref={(el) => {
												fileRefs.current[doc.id] = el;
											}}
											type="file"
											accept="image/*"
											className="sr-only"
											onChange={(e) => {
												pickFile(doc.id, e.target.files?.[0] ?? null);
												e.target.value = "";
											}}
										/>

										{hasImage && imageSrc ? (
											<>
												{/* eslint-disable-next-line @next/next/no-img-element */}
												<img
													src={imageSrc}
													alt=""
													className="h-[180px] w-full object-cover"
												/>
												{status === "rejected" && editable ? (
													<span className="pointer-events-none absolute top-2.5 right-2.5 inline-flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1.5 text-[12px] font-bold text-white">
														<PencilIcon className="size-3.5" />
														{t("providerVerifyChange")}
													</span>
												) : null}
												<span className="pointer-events-none absolute right-2.5 bottom-2.5 flex size-7 items-center justify-center rounded-full bg-black/55 text-white">
													{status === "approved" ? (
														<CheckCircle2Icon className="size-4 text-emerald-300" />
													) : status === "rejected" ? (
														<XIcon className="size-4" />
													) : (
														<HourglassIcon className="size-3.5" />
													)}
												</span>
												{files[doc.id] ? (
													<button
														type="button"
														className="absolute top-2.5 left-2.5 rounded-full bg-black/55 p-1.5 text-white"
														onClick={(e) => {
															e.stopPropagation();
															clearLocal(doc.id);
														}}
														aria-label="Remove"
													>
														<XIcon className="size-3.5" />
													</button>
												) : null}
											</>
										) : (
											<div className="m-1 flex h-[180px] flex-col items-center justify-center gap-2 rounded-[12px] border border-dashed border-border/80">
												<ImagePlusIcon className="size-7 text-muted-foreground" />
												<p className="text-[14px] font-bold text-foreground">
													{t("uploadDocument")}
												</p>
												<p className="text-[12px] text-muted-foreground">
													{t("providerVerifyTapUpload")}
												</p>
											</div>
										)}
									</div>
								</div>
							</article>
						);
					})
				)}

				{!loading && docs.length === 0 ? (
					<p className="text-[14px] text-muted-foreground">
						{t("providerVerifyNotConfigured")}
					</p>
				) : null}
			</div>

			{docs.length > 0 ? (
				<div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex justify-center p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:pl-60">
					<div className="pointer-events-auto w-full max-w-lg">
						<button
							type="button"
							disabled={busy || loading}
							onClick={() => void submit()}
							className={cn(
								"h-12 w-full rounded-xl bg-primary text-[15px] font-semibold text-primary-foreground shadow-sm transition-colors duration-150",
								"hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:ring-offset-2",
								"disabled:cursor-not-allowed disabled:opacity-50",
							)}
						>
							{busy ? t("commonSaving") : t("providerVerifySave")}
						</button>
					</div>
				</div>
			) : null}
		</div>
	);
}

export default function ProviderVerifyIdPage() {
	return (
		<Suspense
			fallback={
				<div className="mx-auto max-w-lg space-y-4 px-4 py-6">
					<div className="h-8 w-40 animate-pulse rounded bg-muted/60" />
					<div className="h-48 animate-pulse rounded-2xl bg-muted/60" />
				</div>
			}
		>
			<ProviderVerifyIdPageInner />
		</Suspense>
	);
}
