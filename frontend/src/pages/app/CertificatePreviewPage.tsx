import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Award, Download, ExternalLink, Calendar } from "lucide-react";
import { api } from "@/services/api";
import type { ApiResponse } from "@/services/api";

interface Certificate {
  _id: string;
  track: { _id: string; title: string } | string;
  certificateUrl?: string;
  verifiedBy?: { _id: string; fullName: string } | string;
  createdAt: string;
}

export default function CertificatePreviewPage() {
  const { data: certificates = [], isLoading } = useQuery<Certificate[]>({
    queryKey: ["certificates"],
    queryFn: async () => {
      const { data } = await api.get<ApiResponse<{ certificates: Certificate[] }>>("/certificates");
      return data.data?.certificates || [];
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
              <Award className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-white">My Certificates</h1>
          </div>
          <p className="text-sm text-gray-400">Your earned certificates and achievements</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white/5 rounded-xl p-6 animate-pulse">
                <div className="h-6 bg-white/10 rounded w-2/3 mb-4" />
                <div className="h-4 bg-white/10 rounded w-1/2 mb-2" />
                <div className="h-4 bg-white/10 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-16">
            <Award className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-400 mb-2">No certificates yet</h3>
            <p className="text-sm text-gray-500">Complete a track to earn your first certificate</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {certificates.map((cert, i) => (
              <motion.div
                key={cert._id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative bg-gradient-to-br from-yellow-500/10 to-amber-500/10 border border-yellow-500/20 rounded-xl p-6 overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-yellow-500/10 to-transparent rounded-bl-full" />
                <div className="relative">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                      <Award className="w-6 h-6 text-yellow-400" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white">
                        {typeof cert.track === "object" ? cert.track.title : "Track Certificate"}
                      </h3>
                      <p className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(cert.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="bg-white/5 rounded-lg p-4 mb-4 border border-white/10">
                    <div className="text-center">
                      <p className="text-[10px] uppercase tracking-widest text-yellow-400 mb-1">Certificate of Completion</p>
                      <p className="text-lg font-bold text-white">
                        {typeof cert.track === "object" ? cert.track.title : "EthioTech Track"}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">EthioTech Platform</p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {cert.certificateUrl && (
                      <a
                        href={cert.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20 rounded-lg text-xs text-yellow-300 transition-all"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> View
                      </a>
                    )}
                    {cert.certificateUrl && (
                      <a
                        href={cert.certificateUrl}
                        download
                        className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-xs text-gray-300 transition-all"
                      >
                        <Download className="w-3.5 h-3.5" /> Download
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
