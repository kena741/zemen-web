import { invokeFunction } from "./client";

/**
 * Dispatch to an existing edge function via dynamic-edge
 * (name moves from URL segment into body).
 */
export async function invokeDynamicEdge<T = Record<string, unknown>>(
	name: string,
	body: Record<string, unknown> = {},
): Promise<T> {
	return invokeFunction<T>("dynamic-edge", { name, ...body });
}
