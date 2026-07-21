import { WordModel, WordProgressRecord, WordSetModel } from "./utils"

class WordStorage {
  dbName: string
  wordSetStoreName: string
  progressStoreName: string
  db: IDBDatabase | null

  constructor() {
    this.dbName = 'PolishUkrainianGame'
    this.wordSetStoreName = 'wordSets'
    this.progressStoreName = 'wordProgress'
    this.db = null
  }

  init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, 2)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve(this.db)
      }

      request.onupgradeneeded = (event:any) => {
        const db = event.target.result
        if (!db.objectStoreNames.contains(this.wordSetStoreName)) {
          db.createObjectStore(this.wordSetStoreName, { keyPath: 'id', autoIncrement: true })
        }
        if (!db.objectStoreNames.contains(this.progressStoreName)) {
          const store = db.createObjectStore(this.progressStoreName, { keyPath: 'wordKey' })
          store.createIndex('setId', 'setId', { unique: false })
          store.createIndex('nextReviewAt', 'nextReviewAt', { unique: false })
        }
      }
    })
  }

  async addWordSet(name:string, words: Array<WordModel>):Promise<string> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.wordSetStoreName], 'readwrite')
      const store = transaction?.objectStore(this.wordSetStoreName)
      const request = store?.add({
        name,
        words,
        createdAt: new Date().toISOString(),
      })

      if (!request) {
        reject(new Error('Failed to create request'))
        return
      }
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result as string)
    })
  }

  
  async getWordSets():Promise<WordSetModel[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.wordSetStoreName], 'readonly')
      const store = transaction?.objectStore(this.wordSetStoreName)
      const request = store?.getAll()

      if (!request) {
        reject(new Error('Failed to create request'))
        return
      }
      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async deleteWordSet(id: string) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.wordSetStoreName], 'readwrite')
      const store = transaction?.objectStore(this.wordSetStoreName)
      const request = store?.delete(id)

      if (!request) {
        reject(new Error('Failed to create request'))
        return
      }

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getWordProgress(wordKey: string):Promise<WordProgressRecord | undefined> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.progressStoreName], 'readonly')
      const store = transaction?.objectStore(this.progressStoreName)
      const request = store?.get(wordKey)

      if (!request) {
        reject(new Error('Failed to create request'))
        return
      }

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getWordProgressBySet(setId:string):Promise<WordProgressRecord[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.progressStoreName], 'readonly')
      const store = transaction?.objectStore(this.progressStoreName)
      const index = store?.index('setId')
      const request = index?.getAll(IDBKeyRange.only(setId))

      if (!request) {
        reject(new Error('Failed to create request'))
        return
      }

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getAllWordProgress():Promise<WordProgressRecord[]> {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.progressStoreName], 'readonly')
      const store = transaction?.objectStore(this.progressStoreName)
      const request = store?.getAll()

      if (!request) {
        reject(new Error('Failed to create request'))
        return
      }

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async saveWordProgress(progress: any) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.progressStoreName], 'readwrite')
      const store = transaction?.objectStore(this.progressStoreName)
      const request = store?.put(progress)

      if (!request) {
        reject(new Error('Failed to create request'))
        return
      }

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async deleteProgressForSet(setId:string) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db?.transaction([this.progressStoreName], 'readwrite')
      const store = transaction?.objectStore(this.progressStoreName)
      const index = store?.index('setId')
      const request = index?.openCursor(IDBKeyRange.only(setId))

      if (!request) {
        reject(new Error('Failed to create request'))
        return
      }

      request.onerror = () => reject(request.error)
      request.onsuccess = (event: any) => {
        const cursor = event.target.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve(event.target.result)
        }
      }
    })
  }
}

const storage = new WordStorage()
export default storage
