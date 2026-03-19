import readingOrder from "../../data/reading-order.json";

interface Reading {
  book: string;
  bookName: string;
  chapter: number;
}

interface AdvanceResult {
  book: string;
  chapter: number;
  cycleCompleted: boolean;
}

const books: { id: string; name: string; chapters: number }[] = readingOrder;

export function getNextReading(currentBook: string, currentChapter: number): Reading {
  const book = books.find((b) => b.id === currentBook);
  if (!book) throw new Error(`Unknown book: ${currentBook}`);
  return { book: book.id, bookName: book.name, chapter: currentChapter };
}

export function advanceReading(currentBook: string, currentChapter: number): AdvanceResult {
  const bookIndex = books.findIndex((b) => b.id === currentBook);
  if (bookIndex === -1) throw new Error(`Unknown book: ${currentBook}`);

  const book = books[bookIndex];

  if (currentChapter < book.chapters) {
    return { book: currentBook, chapter: currentChapter + 1, cycleCompleted: false };
  }

  if (bookIndex < books.length - 1) {
    return { book: books[bookIndex + 1].id, chapter: 1, cycleCompleted: false };
  }

  return { book: books[0].id, chapter: 1, cycleCompleted: true };
}

export function getTotalChapters(): number {
  return books.reduce((sum, b) => sum + b.chapters, 0);
}
