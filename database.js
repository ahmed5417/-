// database.js
// قاعدة بيانات بسيطة للمستخدمين والاشتراكات باستخدام IndexedDB

class Database {
    constructor() {
        this.dbName = 'calculatorAppDB';
        this.dbVersion = 1;
        this.db = null;
        this.initDB();
    }

    // تهيئة قاعدة البيانات
    initDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = (event) => {
                console.error('فشل في فتح قاعدة البيانات:', event.target.error);
                reject(event.target.error);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // إنشاء مخزن للمستخدمين
                if (!db.objectStoreNames.contains('users')) {
                    const usersStore = db.createObjectStore('users', { keyPath: 'username' });
                    usersStore.createIndex('username', 'username', { unique: true });
                    usersStore.createIndex('isAdmin', 'isAdmin', { unique: false });
                }

                // إنشاء مخزن للاشتراكات
                if (!db.objectStoreNames.contains('subscriptions')) {
                    const subscriptionsStore = db.createObjectStore('subscriptions', { keyPath: 'username' });
                    subscriptionsStore.createIndex('username', 'username', { unique: true });
                    subscriptionsStore.createIndex('expiryDate', 'expiryDate', { unique: false });
                }
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                console.log('تم فتح قاعدة البيانات بنجاح');
                
                // إضافة مستخدم المسؤول الافتراضي إذا لم يكن موجوداً
                this.getUser('admin').then(user => {
                    if (!user) {
                        this.addUser({
                            username: 'admin',
                            password: 'admin123',
                            isAdmin: true
                        });
                    }
                });
                
                resolve(this.db);
            };
        });
    }

    // إضافة مستخدم جديد
    addUser(user) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readwrite');
            const usersStore = transaction.objectStore('users');
            const request = usersStore.add(user);

            request.onsuccess = () => {
                console.log('تم إضافة المستخدم بنجاح');
                resolve(true);
            };

            request.onerror = (event) => {
                console.error('فشل في إضافة المستخدم:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // الحصول على مستخدم بواسطة اسم المستخدم
    getUser(username) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const usersStore = transaction.objectStore('users');
            const request = usersStore.get(username);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('فشل في الحصول على المستخدم:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // التحقق من صحة بيانات تسجيل الدخول
    validateLogin(username, password) {
        return new Promise((resolve, reject) => {
            this.getUser(username).then(user => {
                if (user && user.password === password) {
                    resolve(user);
                } else {
                    resolve(null);
                }
            }).catch(error => {
                reject(error);
            });
        });
    }

    // إضافة اشتراك جديد
    addSubscription(subscription) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['subscriptions'], 'readwrite');
            const subscriptionsStore = transaction.objectStore('subscriptions');
            const request = subscriptionsStore.put(subscription);

            request.onsuccess = () => {
                console.log('تم إضافة/تحديث الاشتراك بنجاح');
                resolve(true);
            };

            request.onerror = (event) => {
                console.error('فشل في إضافة/تحديث الاشتراك:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // الحصول على اشتراك بواسطة اسم المستخدم
    getSubscription(username) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['subscriptions'], 'readonly');
            const subscriptionsStore = transaction.objectStore('subscriptions');
            const request = subscriptionsStore.get(username);

            request.onsuccess = () => {
                resolve(request.result);
            };

            request.onerror = (event) => {
                console.error('فشل في الحصول على الاشتراك:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // التحقق من صلاحية الاشتراك
    checkSubscriptionValidity(username) {
        return new Promise((resolve, reject) => {
            this.getSubscription(username).then(subscription => {
                if (subscription) {
                    const now = new Date();
                    const expiryDate = new Date(subscription.expiryDate);
                    resolve(now <= expiryDate);
                } else {
                    resolve(false);
                }
            }).catch(error => {
                reject(error);
            });
        });
    }

    // الحصول على جميع المستخدمين
    getAllUsers() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users'], 'readonly');
            const usersStore = transaction.objectStore('users');
            const request = usersStore.openCursor();
            const users = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    users.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(users);
                }
            };

            request.onerror = (event) => {
                console.error('فشل في الحصول على المستخدمين:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // الحصول على جميع الاشتراكات
    getAllSubscriptions() {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['subscriptions'], 'readonly');
            const subscriptionsStore = transaction.objectStore('subscriptions');
            const request = subscriptionsStore.openCursor();
            const subscriptions = [];

            request.onsuccess = (event) => {
                const cursor = event.target.result;
                if (cursor) {
                    subscriptions.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(subscriptions);
                }
            };

            request.onerror = (event) => {
                console.error('فشل في الحصول على الاشتراكات:', event.target.error);
                reject(event.target.error);
            };
        });
    }

    // حذف مستخدم
    deleteUser(username) {
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction(['users', 'subscriptions'], 'readwrite');
            const usersStore = transaction.objectStore('users');
            const subscriptionsStore = transaction.objectStore('subscriptions');
            
            // حذف المستخدم
            const userRequest = usersStore.delete(username);
            
            userRequest.onsuccess = () => {
                // حذف اشتراك المستخدم
                const subscriptionRequest = subscriptionsStore.delete(username);
                
                subscriptionRequest.onsuccess = () => {
                    console.log('تم حذف المستخدم واشتراكه بنجاح');
                    resolve(true);
                };
                
                subscriptionRequest.onerror = (event) => {
                    console.error('فشل في حذف اشتراك المستخدم:', event.target.error);
                    reject(event.target.error);
                };
            };
            
            userRequest.onerror = (event) => {
                console.error('فشل في حذف المستخدم:', event.target.error);
                reject(event.target.error);
            };
        });
    }
}

// تصدير الكلاس
window.Database = Database;
