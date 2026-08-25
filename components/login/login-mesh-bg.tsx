"use client";

import { useEffect, useRef } from "react";

/**
 * Stripe-style abstract ribbon — Zemen brand greens.
 */
export function LoginMeshBackground() {
	const canvasRef = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = canvasRef.current;
		if (!canvas) return;

		const ctx = canvas.getContext("2d", { alpha: true });
		if (!ctx) return;

		const reduceMotion = window.matchMedia(
			"(prefers-reduced-motion: reduce)",
		).matches;

		const off = document.createElement("canvas");
		const octx = off.getContext("2d", { alpha: true });
		if (!octx) return;

		let raf = 0;
		let w = 0;
		let h = 0;
		let dpr = 1;

		function resize() {
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			w = window.innerWidth;
			h = window.innerHeight;
			canvas!.width = Math.floor(w * dpr);
			canvas!.height = Math.floor(h * dpr);
			canvas!.style.width = `${w}px`;
			canvas!.style.height = `${h}px`;
			off.width = canvas!.width;
			off.height = canvas!.height;
		}

		function ribbonPath(
			c: CanvasRenderingContext2D,
			phase: number,
			inset: number,
		) {
			const x0 = w * (0.55 + inset);
			c.beginPath();
			c.moveTo(x0 + w * 0.08, -h * 0.05);
			c.bezierCurveTo(
				x0 + w * (0.42 + Math.sin(phase) * 0.03),
				h * 0.18,
				x0 + w * (0.02 + Math.cos(phase * 0.8) * 0.04),
				h * 0.42,
				x0 + w * (0.38 + Math.sin(phase * 1.1) * 0.03),
				h * 0.58,
			);
			c.bezierCurveTo(
				x0 + w * (0.55 + Math.cos(phase) * 0.04),
				h * 0.72,
				x0 + w * (0.12 + Math.sin(phase * 0.7) * 0.03),
				h * 0.88,
				x0 + w * 0.4,
				h * 1.08,
			);
		}

		function paint(time: number) {
			const phase = reduceMotion ? 0 : time * 0.00035;

			octx!.setTransform(dpr, 0, 0, dpr, 0, 0);
			octx!.clearRect(0, 0, w, h);
			octx!.filter = "none";
			octx!.lineCap = "round";
			octx!.lineJoin = "round";

			const grad = octx!.createLinearGradient(w * 0.55, 0, w * 1.05, h);
			grad.addColorStop(0, "#0E2604");
			grad.addColorStop(0.2, "#174309");
			grad.addColorStop(0.4, "#1F5A0B");
			grad.addColorStop(0.55, "#2E7A14");
			grad.addColorStop(0.72, "#1F5A0B");
			grad.addColorStop(0.9, "#174309");
			grad.addColorStop(1, "#0E2604");

			octx!.strokeStyle = grad;
			octx!.lineWidth = Math.min(w, h) * 0.22;
			ribbonPath(octx!, phase, 0);
			octx!.stroke();

			octx!.globalAlpha = 0.55;
			octx!.lineWidth = Math.min(w, h) * 0.14;
			ribbonPath(octx!, phase + 0.6, 0.06);
			octx!.stroke();
			octx!.globalAlpha = 1;

			octx!.strokeStyle = "rgba(232, 245, 227, 0.35)";
			octx!.lineWidth = Math.min(w, h) * 0.06;
			ribbonPath(octx!, phase * 1.05, 0.02);
			octx!.stroke();

			const blurPx = Math.max(28, Math.min(w, h) * 0.04) * dpr;
			ctx!.setTransform(1, 0, 0, 1, 0, 0);
			ctx!.clearRect(0, 0, canvas!.width, canvas!.height);
			ctx!.filter = `blur(${blurPx}px)`;
			ctx!.globalAlpha = 0.95;
			ctx!.drawImage(off, 0, 0);
			ctx!.filter = "none";
			ctx!.globalAlpha = 1;
		}

		resize();
		paint(0);

		if (!reduceMotion) {
			const loop = (t: number) => {
				paint(t);
				raf = requestAnimationFrame(loop);
			};
			raf = requestAnimationFrame(loop);
		}

		window.addEventListener("resize", resize);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("resize", resize);
		};
	}, []);

	return (
		<canvas
			ref={canvasRef}
			aria-hidden
			className="pointer-events-none absolute inset-0 z-0"
		/>
	);
}
