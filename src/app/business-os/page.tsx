import { PublicInfoPage } from "@/components/PublicInfoPage";
import { PUBLIC_PAGES } from "@/lib/public-pages";

export const metadata = {
  title: `${PUBLIC_PAGES["business-os"].eyebrow} — FOYSAL IT OS`,
  description: PUBLIC_PAGES["business-os"].description,
};

export default function Page() {
  return <PublicInfoPage page={PUBLIC_PAGES["business-os"]} />;
}
