import { redirect } from "next/navigation";

/** Customer home lives at `/`; keep `/service` as an alias. */
export default function ServiceHomeRedirect() {
	redirect("/");
}
