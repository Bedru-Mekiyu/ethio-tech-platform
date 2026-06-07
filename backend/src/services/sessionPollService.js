import SessionPoll from "../models/SessionPoll.js";

export const createPoll = async ({ sessionId, userId, question, type, options }) => {
  let pollOptions;
  if (type === "true_false") {
    pollOptions = [
      { text: "True", votes: [], voteCount: 0 },
      { text: "False", votes: [], voteCount: 0 },
    ];
  } else {
    pollOptions = options.map((opt) => ({
      text: opt.trim(),
      votes: [],
      voteCount: 0,
    }));
    if (pollOptions.length < 2) throw new Error("At least 2 options required");
    if (pollOptions.length > 10) throw new Error("Maximum 10 options allowed");
  }

  const poll = await SessionPoll.create({
    session: sessionId,
    question: question.trim(),
    type,
    options: pollOptions,
    createdBy: userId,
  });

  return poll;
};

const normalizeOptionIndexes = ({ optionIndex, optionIndexes }) => {
  if (Array.isArray(optionIndexes)) {
    return [...new Set(optionIndexes.map((index) => Number(index)))];
  }
  if (optionIndex !== undefined && optionIndex !== null) {
    return [Number(optionIndex)];
  }
  return [];
};

export const votePoll = async ({ pollId, userId, optionIndex, optionIndexes } = {}) => {
  const poll = await SessionPoll.findById(pollId);
  if (!poll) throw new Error("Poll not found");
  if (poll.status !== "active") throw new Error("Poll is not active");

  const selectedIndexes = normalizeOptionIndexes({ optionIndex, optionIndexes });
  if (selectedIndexes.length === 0) throw new Error("At least one option is required");

  if (poll.type === "single" || poll.type === "true_false") {
    if (selectedIndexes.length !== 1) throw new Error("Single-choice polls accept exactly one option");
    for (const option of poll.options) {
      option.votes = option.votes.filter((id) => String(id) !== String(userId));
      option.voteCount = option.votes.length;
    }
  }

  for (const index of selectedIndexes) {
    if (!Number.isInteger(index) || index < 0 || index >= poll.options.length) {
      throw new Error("Invalid option index");
    }
  }

  let voted = false;
  for (const index of selectedIndexes) {
    const selectedOption = poll.options[index];
    const alreadyVoted = selectedOption.votes.some((id) => String(id) === String(userId));

    if (alreadyVoted) {
      selectedOption.votes = selectedOption.votes.filter((id) => String(id) !== String(userId));
    } else {
      selectedOption.votes.push(userId);
      voted = true;
    }
    selectedOption.voteCount = selectedOption.votes.length;
  }

  poll.totalVotes = poll.options.reduce((sum, opt) => sum + opt.voteCount, 0);
  await poll.save();

  return { poll, voted, optionIndexes: selectedIndexes, optionIndex: selectedIndexes[0] };
};

export const closePoll = async (pollId) => {
  const poll = await SessionPoll.findById(pollId);
  if (!poll) throw new Error("Poll not found");
  poll.status = "closed";
  poll.closedAt = new Date();
  await poll.save();
  return poll;
};

export const reopenPoll = async (pollId) => {
  const poll = await SessionPoll.findById(pollId);
  if (!poll) throw new Error("Poll not found");
  poll.status = "active";
  poll.closedAt = null;
  await poll.save();
  return poll;
};

export const publishResults = async (pollId) => {
  const poll = await SessionPoll.findById(pollId);
  if (!poll) throw new Error("Poll not found");
  poll.status = "results_published";
  poll.resultsPublishedAt = new Date();
  await poll.save();
  return poll;
};

export const getSessionPolls = async (sessionId, includeClosed = false) => {
  const filter = { session: sessionId };
  if (!includeClosed) filter.status = "active";
  return SessionPoll.find(filter).populate("createdBy", "fullName").sort({ createdAt: -1 });
};

export const getPollResults = async (pollId) => {
  const poll = await SessionPoll.findById(pollId).populate("createdBy", "fullName");
  if (!poll) throw new Error("Poll not found");
  const results = poll.options.map((opt, index) => ({
    index,
    text: opt.text,
    voteCount: opt.voteCount,
    percentage: poll.totalVotes > 0 ? Math.round((opt.voteCount / poll.totalVotes) * 100) : 0,
  }));
  return { poll, results, totalVotes: poll.totalVotes };
};

export const getPollStats = async (sessionId) => {
  const polls = await SessionPoll.find({ session: sessionId });
  return {
    total: polls.length,
    active: polls.filter((p) => p.status === "active").length,
    closed: polls.filter((p) => p.status === "closed").length,
    published: polls.filter((p) => p.status === "results_published").length,
    totalVotes: polls.reduce((sum, p) => sum + p.totalVotes, 0),
  };
};
