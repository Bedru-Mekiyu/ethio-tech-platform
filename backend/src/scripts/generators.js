import Track from "../models/Track.js";
import Module from "../models/Module.js";
import Lesson from "../models/Lesson.js";
import Project from "../models/Project.js";

import { TRACK_SLUGS } from "./datasets.js";

function sleep(ms){return new Promise(r=>setTimeout(r,ms));}

export async function createTracksAndContent() {
  const created = [];
  for (const t of TRACK_SLUGS) {
    const track = await Track.create({ title: t.title, description: `${t.title} track focused on practical skills.`, category: t.category, estimatedWeeks: t.category === 'beginner' ? 6 : 12 });
    // create 3 modules
    const modules = [];
    for (let m=0;m<3;m++){
      const module = await Module.create({ title: `${t.title} Module ${m+1}`, description: `Core concepts for ${t.title} - module ${m+1}`, track: track._id, order: m });
      modules.push(module);
      // create 4 lessons
      const lessons = [];
      for (let l=0;l<4;l++){
        const lesson = await Lesson.create({ title: `${module.title} - Lesson ${l+1}`, content: `Lesson content for ${module.title} lesson ${l+1}`, xpReward: 20 + (l*5), module: module._id, durationMinutes: 10 + l*5, order: l });
        lessons.push(lesson);
      }
      module.lessons = lessons.map(x=>x._id);
      await module.save();
    }
    track.modules = modules.map(x=>x._id);
    // create 2 projects per track
    const projects = [];
    for (let p=0;p<2;p++){
      const project = await Project.create({ title: `${t.title} Project ${p+1}`, description: `Build a ${t.title.toLowerCase()} project.`, track: track._id, difficulty: p===0?'easy':'medium', xpReward: p===0?300:600, requirements: [`Implement core features of ${t.title}`] });
      projects.push(project);
    }
    await track.save();
    created.push(track);
    // small pause to avoid hammering
    await sleep(10);
  }
  return created;
}
