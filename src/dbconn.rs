use deadpool_redis::{Config, Pool, Runtime};

use crate::CONFIG;

lazy_static! {
    /// 'Deadpool' holds active connections to the Redis challenge pool. (cache)
    /// Fetch with `POOL.get_pool()`
    pub static ref POOL: Pool = {
        let cfg = Config::from_url(&CONFIG.redis_uri);
        let pool = cfg.create_pool(Some(Runtime::Tokio1)).unwrap();
        pool.resize(CONFIG.redis_pool_size);
        pool
    };
}
