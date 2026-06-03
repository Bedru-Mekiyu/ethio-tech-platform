import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Search, Star, Calendar, MessageCircle, Users } from "lucide-react";

interface Mentor {
  _id: string;
  fullName: string;
  avatar?: string;
  bio?: string;
  expertise?: string[];
  rating?: number;
  sessionCount?: number;
  studentCount?: number;
}

interface MentorDirectoryProps {
  mentors: Mentor[];
  loading?: boolean;
  onStartConversation?: (mentorId: string) => void;
}

export function MentorDirectory({ mentors, loading, onStartConversation }: MentorDirectoryProps) {
  const [search, setSearch] = useState("");
  const [selectedExpertise, setSelectedExpertise] = useState<string | null>(null);

  const allExpertise = useMemo(() => {
    const set = new Set<string>();
    mentors.forEach(m => m.expertise?.forEach(e => set.add(e)));
    return [...set].sort();
  }, [mentors]);

  const filtered = useMemo(() => {
    return mentors.filter(m => {
      const matchesSearch = !search || m.fullName.toLowerCase().includes(search.toLowerCase());
      const matchesExpertise = !selectedExpertise || m.expertise?.includes(selectedExpertise);
      return matchesSearch && matchesExpertise;
    });
  }, [mentors, search, selectedExpertise]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="bg-white/5 rounded-xl p-5 animate-pulse">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-white/10" />
              <div className="space-y-2 flex-1">
                <div className="h-4 bg-white/10 rounded w-2/3" />
                <div className="h-3 bg-white/10 rounded w-1/2" />
              </div>
            </div>
            <div className="space-y-2">
              <div className="h-3 bg-white/10 rounded" />
              <div className="h-3 bg-white/10 rounded w-3/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search mentors..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-cyan-500/50"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => setSelectedExpertise(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              !selectedExpertise ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-white/5 text-gray-400 border border-white/10"
            }`}
          >
            All
          </button>
          {allExpertise.slice(0, 8).map(exp => (
            <button
              key={exp}
              onClick={() => setSelectedExpertise(exp === selectedExpertise ? null : exp)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                selectedExpertise === exp ? "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30" : "bg-white/5 text-gray-400 border border-white/10"
              }`}
            >
              {exp}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((mentor, i) => (
          <motion.div
            key={mentor._id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-5 hover:border-cyan-500/30 transition-all group"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white font-bold text-lg overflow-hidden">
                {mentor.avatar ? (
                  <img src={mentor.avatar} alt={mentor.fullName} className="w-full h-full object-cover" />
                ) : (
                  mentor.fullName.charAt(0).toUpperCase()
                )}
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">{mentor.fullName}</h3>
                {mentor.rating != null && (
                  <div className="flex items-center gap-1 text-xs text-yellow-400">
                    <Star className="w-3 h-3 fill-current" />
                    <span>{mentor.rating.toFixed(1)}</span>
                  </div>
                )}
              </div>
            </div>
            {mentor.bio && (
              <p className="text-xs text-gray-400 line-clamp-2 mb-3">{mentor.bio}</p>
            )}
            {mentor.expertise && mentor.expertise.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-3">
                {mentor.expertise.slice(0, 3).map(exp => (
                  <span key={exp} className="px-2 py-0.5 bg-white/10 rounded text-[10px] text-gray-300">{exp}</span>
                ))}
                {mentor.expertise.length > 3 && (
                  <span className="px-2 py-0.5 bg-white/10 rounded text-[10px] text-gray-400">+{mentor.expertise.length - 3}</span>
                )}
              </div>
            )}
            <div className="flex items-center gap-4 text-xs text-gray-500 mb-3">
              {mentor.sessionCount != null && (
                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{mentor.sessionCount} sessions</span>
              )}
              {mentor.studentCount != null && (
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{mentor.studentCount} students</span>
              )}
            </div>
            <div className="flex gap-2">
              {onStartConversation && (
                <button
                  onClick={() => onStartConversation(mentor._id)}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/20 rounded-lg text-xs text-cyan-300 transition-all"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> Message
                </button>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <p className="text-sm">No mentors found matching your criteria</p>
        </div>
      )}
    </div>
  );
}
