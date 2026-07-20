class WordStorage {
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

      request.onupgradeneeded = (event) => {
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

  async addWordSet(name, words) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.wordSetStoreName], 'readwrite')
      const store = transaction.objectStore(this.wordSetStoreName)
      const request = store.add({
        name,
        words,
        createdAt: new Date().toISOString(),
      })

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getWordSets() {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.wordSetStoreName], 'readonly')
      const store = transaction.objectStore(this.wordSetStoreName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async deleteWordSet(id) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.wordSetStoreName], 'readwrite')
      const store = transaction.objectStore(this.wordSetStoreName)
      const request = store.delete(id)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve()
    })
  }

  async getWordProgress(wordKey) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.progressStoreName], 'readonly')
      const store = transaction.objectStore(this.progressStoreName)
      const request = store.get(wordKey)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getWordProgressBySet(setId) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.progressStoreName], 'readonly')
      const store = transaction.objectStore(this.progressStoreName)
      const index = store.index('setId')
      const request = index.getAll(IDBKeyRange.only(setId))

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async getAllWordProgress() {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.progressStoreName], 'readonly')
      const store = transaction.objectStore(this.progressStoreName)
      const request = store.getAll()

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async saveWordProgress(progress) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.progressStoreName], 'readwrite')
      const store = transaction.objectStore(this.progressStoreName)
      const request = store.put(progress)

      request.onerror = () => reject(request.error)
      request.onsuccess = () => resolve(request.result)
    })
  }

  async deleteProgressForSet(setId) {
    if (!this.db) await this.init()

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.progressStoreName], 'readwrite')
      const store = transaction.objectStore(this.progressStoreName)
      const index = store.index('setId')
      const request = index.openCursor(IDBKeyRange.only(setId))

      request.onerror = () => reject(request.error)
      request.onsuccess = (event) => {
        const cursor = event.target.result
        if (cursor) {
          cursor.delete()
          cursor.continue()
        } else {
          resolve()
        }
      }
    })
  }
}

const storage = new WordStorage()
export default storage
