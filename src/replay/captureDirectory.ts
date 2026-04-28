import type { ReplayCapture } from './types';

const DB_NAME = 'visulive-storage';
const STORE_NAME = 'handles';
const CAPTURE_DIRECTORY_KEY = 'capture-directory';

type HandleRecord = {
  key: string;
  value: FileSystemDirectoryHandle;
};

type FileSystemPermissionModeLike = 'read' | 'readwrite';
type FileSystemPermissionStateLike = 'granted' | 'denied' | 'prompt';
type DirectoryHandleWithPermission = FileSystemDirectoryHandle & {
  queryPermission?: (
    options?: { mode?: FileSystemPermissionModeLike }
  ) => Promise<FileSystemPermissionStateLike>;
  requestPermission?: (
    options?: { mode?: FileSystemPermissionModeLike }
  ) => Promise<FileSystemPermissionStateLike>;
};
type WindowWithDirectoryPicker = Window &
  typeof globalThis & {
    showDirectoryPicker?: (
      options?: { mode?: FileSystemPermissionModeLike }
    ) => Promise<FileSystemDirectoryHandle>;
  };

export type CaptureDirectoryBlobFile = {
  fileName: string;
  blob: Blob;
};

type CaptureDirectoryTargetOptions = {
  subdirectories?: string[];
  retry?: {
    attempts?: number;
    delayMs?: number;
  };
};

const DEFAULT_JSON_WRITE_RETRY_ATTEMPTS = 3;
const DEFAULT_JSON_WRITE_RETRY_DELAY_MS = 120;

function supportsFileSystemAccess(): boolean {
  return (
    typeof window !== 'undefined' &&
    'showDirectoryPicker' in window &&
    'indexedDB' in window
  );
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, 1);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open capture directory storage.'));
    };
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => Promise<T> | T
): Promise<T> {
  const database = await openDatabase();

  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(STORE_NAME, mode);
      const store = transaction.objectStore(STORE_NAME);

      Promise.resolve(run(store)).then(resolve, reject);

      transaction.onerror = () => {
        reject(transaction.error ?? new Error('Capture directory storage transaction failed.'));
      };
    });
  } finally {
    database.close();
  }
}

export async function loadStoredCaptureDirectoryHandle(): Promise<FileSystemDirectoryHandle | null> {
  if (!supportsFileSystemAccess()) {
    return null;
  }

  return withStore('readonly', async (store) => {
    const request = store.get(CAPTURE_DIRECTORY_KEY);

    return new Promise<FileSystemDirectoryHandle | null>((resolve, reject) => {
      request.onsuccess = () => {
        const result = request.result as HandleRecord | undefined;
        resolve(result?.value ?? null);
      };

      request.onerror = () => {
        reject(request.error ?? new Error('Failed to load stored capture directory.'));
      };
    });
  });
}

export async function persistCaptureDirectoryHandle(
  handle: FileSystemDirectoryHandle
): Promise<void> {
  if (!supportsFileSystemAccess()) {
    return;
  }

  await withStore('readwrite', async (store) => {
    const request = store.put({
      key: CAPTURE_DIRECTORY_KEY,
      value: handle
    } satisfies HandleRecord);

    return new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => {
        reject(request.error ?? new Error('Failed to persist capture directory.'));
      };
    });
  });
}

export async function clearStoredCaptureDirectoryHandle(): Promise<void> {
  if (!supportsFileSystemAccess()) {
    return;
  }

  await withStore('readwrite', async (store) => {
    const request = store.delete(CAPTURE_DIRECTORY_KEY);

    return new Promise<void>((resolve, reject) => {
      request.onsuccess = () => resolve();
      request.onerror = () => {
        reject(request.error ?? new Error('Failed to clear stored capture directory.'));
      };
    });
  });
}

export async function pickCaptureDirectoryHandle(): Promise<FileSystemDirectoryHandle> {
  if (!supportsFileSystemAccess()) {
    throw new Error('Capture folder saving is not supported in this browser.');
  }

  const pickerWindow = window as WindowWithDirectoryPicker;

  if (!pickerWindow.showDirectoryPicker) {
    throw new Error('Capture folder saving is not supported in this browser.');
  }

  return pickerWindow.showDirectoryPicker({
    mode: 'readwrite'
  });
}

export async function ensureCaptureDirectoryPermission(
  handle: FileSystemDirectoryHandle,
  requestWrite = false
): Promise<boolean> {
  const permissionHandle = handle as DirectoryHandleWithPermission;
  const mode: FileSystemPermissionModeLike = 'readwrite';
  const options = { mode };
  const current = await permissionHandle.queryPermission?.(options);

  if (current === 'granted') {
    return true;
  }

  if (!requestWrite) {
    return false;
  }

  const next = await permissionHandle.requestPermission?.(options);
  return next === 'granted';
}

export function getCaptureDirectoryDisplayName(
  handle: FileSystemDirectoryHandle
): string {
  return handle.name === 'captures' ? 'captures/inbox' : handle.name;
}

async function resolveCaptureDirectoryTarget(
  handle: FileSystemDirectoryHandle,
  options?: CaptureDirectoryTargetOptions
): Promise<{
  directoryHandle: FileSystemDirectoryHandle;
  folderLabel: string;
}> {
  let directoryHandle = handle;
  let folderLabel = handle.name;

  if (handle.name === 'captures') {
    directoryHandle = await handle.getDirectoryHandle('inbox', { create: true });
    folderLabel = 'captures/inbox';
  }

  for (const subdirectory of options?.subdirectories ?? []) {
    if (typeof subdirectory !== 'string' || subdirectory.trim().length === 0) {
      continue;
    }

    directoryHandle = await directoryHandle.getDirectoryHandle(subdirectory, {
      create: true
    });
    folderLabel = `${folderLabel}/${subdirectory}`;
  }

  return {
    directoryHandle,
    folderLabel
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    globalThis.setTimeout(resolve, ms);
  });
}

export function isTransientCaptureDirectoryWriteError(error: unknown): boolean {
  const message =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : typeof error === 'string'
        ? error
        : '';

  return [
    'InvalidStateError',
    'NoModificationAllowedError',
    'state cached in an interface object',
    'state had changed since it was read from disk',
    'operation is insecure'
  ].some((pattern) => message.toLowerCase().includes(pattern.toLowerCase()));
}

async function writeTextFileWithRetry(
  directoryHandle: FileSystemDirectoryHandle,
  fileName: string,
  contents: string,
  options?: CaptureDirectoryTargetOptions
): Promise<void> {
  const attempts = Math.max(
    1,
    Math.floor(options?.retry?.attempts ?? DEFAULT_JSON_WRITE_RETRY_ATTEMPTS)
  );
  const delayMs = Math.max(
    0,
    Math.floor(options?.retry?.delayMs ?? DEFAULT_JSON_WRITE_RETRY_DELAY_MS)
  );
  let latestError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const fileHandle = await directoryHandle.getFileHandle(fileName, {
        create: true
      });
      const writable = await fileHandle.createWritable();

      try {
        await writable.write(contents);
      } finally {
        await writable.close();
      }

      return;
    } catch (error) {
      latestError = error;

      if (attempt >= attempts || !isTransientCaptureDirectoryWriteError(error)) {
        break;
      }

      await delay(delayMs * attempt);
    }
  }

  throw latestError instanceof Error
    ? latestError
    : new Error(`Failed to write ${fileName}.`);
}

async function writeBlobFileWithRetry(
  directoryHandle: FileSystemDirectoryHandle,
  fileName: string,
  blob: Blob,
  options?: CaptureDirectoryTargetOptions
): Promise<void> {
  const attempts = Math.max(
    1,
    Math.floor(options?.retry?.attempts ?? DEFAULT_JSON_WRITE_RETRY_ATTEMPTS)
  );
  const delayMs = Math.max(
    0,
    Math.floor(options?.retry?.delayMs ?? DEFAULT_JSON_WRITE_RETRY_DELAY_MS)
  );
  let latestError: unknown = null;

  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const fileHandle = await directoryHandle.getFileHandle(fileName, {
        create: true
      });
      const writable = await fileHandle.createWritable();

      try {
        await writable.write(blob);
      } finally {
        await writable.close();
      }

      return;
    } catch (error) {
      latestError = error;

      if (attempt >= attempts || !isTransientCaptureDirectoryWriteError(error)) {
        break;
      }

      await delay(delayMs * attempt);
    }
  }

  throw latestError instanceof Error
    ? latestError
    : new Error(`Failed to write ${fileName}.`);
}

export async function saveJsonArtifactToDirectory(
  handle: FileSystemDirectoryHandle,
  fileName: string,
  artifact: unknown,
  options?: CaptureDirectoryTargetOptions
): Promise<{ fileName: string; folderLabel: string }> {
  const { directoryHandle, folderLabel } = await resolveCaptureDirectoryTarget(
    handle,
    options
  );
  const contents = JSON.stringify(artifact, null, 2);

  await writeTextFileWithRetry(directoryHandle, fileName, contents, options);

  return {
    fileName,
    folderLabel
  };
}

export async function saveReplayCaptureToDirectory(
  handle: FileSystemDirectoryHandle,
  capture: ReplayCapture,
  options?: CaptureDirectoryTargetOptions
): Promise<{ fileName: string; folderLabel: string }> {
  const fileName = `${capture.metadata.label}.json`;
  return saveJsonArtifactToDirectory(handle, fileName, capture, options);
}

export async function saveCaptureBlobsToDirectory(
  handle: FileSystemDirectoryHandle,
  files: CaptureDirectoryBlobFile[],
  options?: CaptureDirectoryTargetOptions
): Promise<{
  folderLabel: string;
  savedFileNames: string[];
  warning?: string;
}> {
  const { directoryHandle, folderLabel } = await resolveCaptureDirectoryTarget(
    handle,
    options
  );
  const savedFileNames: string[] = [];
  let failedCount = 0;

  for (const file of files) {
    try {
      await writeBlobFileWithRetry(directoryHandle, file.fileName, file.blob, options);
      savedFileNames.push(file.fileName);
    } catch {
      failedCount += 1;
    }
  }

  return {
    folderLabel,
    savedFileNames,
    warning:
      failedCount > 0
        ? `Failed to save ${failedCount} proof still${failedCount === 1 ? '' : 's'} alongside the capture JSON.`
        : undefined
  };
}

export function fileSystemAccessSupported(): boolean {
  return supportsFileSystemAccess();
}
