import { Tabs } from "@/components/tabs";
import { ADRT_BAB, ADRT_SIGNATORIES, RAB_SECTIONS } from "@/lib/adrt-content";

const ADRT_PDF_URL =
  "https://evsec5tlwbvans0i.public.blob.vercel-storage.com/dokumen/ADRT-NHKBP-Immanuel-2026-2027.pdf";
const RAB_PDF_URL =
  "https://evsec5tlwbvans0i.public.blob.vercel-storage.com/dokumen/RAB-NHKBP-2026.pdf";

function PdfLink({ href }: { href: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-block rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      Lihat/Unduh PDF Asli
    </a>
  );
}

function AdrtTab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-600">
          Anggaran Dasar &amp; Anggaran Rumah Tangga (AD/ART) Naposobulung HKBP Immanuel
          Dumai Ressort Immanuel, periode 2026-2027 — mengatur hak dan kewajiban setiap
          anggota.
        </p>
        <PdfLink href={ADRT_PDF_URL} />
      </div>

      {ADRT_BAB.map((bab) => (
        <div key={bab.title} className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-900">{bab.title}</h2>
          <div className="mt-4 space-y-4">
            {bab.pasal.map((pasal) => (
              <div key={pasal.title}>
                <h3 className="text-sm font-semibold text-brand">{pasal.title}</h3>
                <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm text-slate-600">
                  {pasal.points.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-5 text-sm text-slate-600">
        <p className="font-semibold text-slate-900">Disetujui &amp; Diketahui Oleh:</p>
        <ul className="mt-2 space-y-1">
          {ADRT_SIGNATORIES.map((s) => (
            <li key={s.name}>
              {s.name} — <span className="text-slate-500">{s.role}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RabTab() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="max-w-2xl text-sm text-slate-600">
          Rencana Usulan Program Tahunan Naposobulung HKBP Immanuel Ressort Immanuel Dumai
          — kegiatan-kegiatan yang direncanakan dilaksanakan oleh seluruh keanggotaan
          sepanjang tahun 2026.
        </p>
        <PdfLink href={RAB_PDF_URL} />
      </div>

      {RAB_SECTIONS.map((section) => (
        <div key={section.title} className="rounded-lg border border-slate-200 bg-white p-5">
          <h2 className="text-base font-bold text-slate-900">{section.title}</h2>
          <ol className="mt-3 list-decimal space-y-1.5 pl-5 text-sm text-slate-600">
            {section.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        </div>
      ))}
    </div>
  );
}

export default function DokumenPage() {
  const tabs = [
    { id: "hak-kewajiban", label: "Hak & Kewajiban Anggota", content: <AdrtTab /> },
    { id: "program-kerja", label: "Program Kerja", content: <RabTab /> },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900">Dokumen Organisasi</h1>
      <p className="mt-1 text-sm text-slate-500">
        AD/ART dan rencana program kerja resmi Naposobulung HKBP Immanuel Dumai.
      </p>
      <div className="mt-6">
        <Tabs tabs={tabs} />
      </div>
    </div>
  );
}
