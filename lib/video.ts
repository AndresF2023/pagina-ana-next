export function getYouTubeVideoId(parsed: URL): string {
  const host = parsed.hostname.replace("www.", "");

  if (host.includes("youtube.com")) {
    const fromQuery = parsed.searchParams.get("v");
    if (fromQuery) return fromQuery;

    const segments = parsed.pathname.split("/").filter(Boolean);
    if (["shorts", "embed", "live"].includes(segments[0])) {
      return segments[1] || "";
    }
  }

  if (host.includes("youtu.be")) {
    return parsed.pathname.split("/").filter(Boolean)[0] || "";
  }

  return "";
}

export function getEmbedUrl(url: string): string {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace("www.", "");
    const youtubeId = getYouTubeVideoId(parsed);

    if (youtubeId) {
      return `https://www.youtube.com/embed/${youtubeId}?rel=0&modestbranding=1`;
    }

    if (host.includes("vimeo.com")) {
      const videoId = parsed.pathname.split("/").filter(Boolean).pop();
      if (videoId) return `https://player.vimeo.com/video/${videoId}`;
    }
  } catch {
    return "";
  }

  return "";
}

export function getYouTubeThumbnail(url: string): string {
  try {
    const parsed = new URL(url);
    const videoId = getYouTubeVideoId(parsed);
    if (!videoId) return "";
    return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
  } catch {
    return "";
  }
}

export function isDirectVideo(url: string): boolean {
  try {
    const pathname = new URL(url).pathname.toLowerCase();
    return /\.(mp4|webm|mov|m4v|ogv|mkv|avi)$/.test(pathname);
  } catch {
    return false;
  }
}
