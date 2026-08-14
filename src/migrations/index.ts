import * as migration_20250929_111647 from './20250929_111647'
import * as migration_20260508_215307 from './20260508_215307'
import * as migration_20260814_090000 from './20260814_090000'
import * as migration_20260814_100000 from './20260814_100000'
import * as migration_20260814_110000 from './20260814_110000'

export const migrations = [
  {
    up: migration_20250929_111647.up,
    down: migration_20250929_111647.down,
    name: '20250929_111647',
  },
  {
    up: migration_20260508_215307.up,
    down: migration_20260508_215307.down,
    name: '20260508_215307',
  },
  {
    up: migration_20260814_090000.up,
    down: migration_20260814_090000.down,
    name: '20260814_090000',
  },
  {
    up: migration_20260814_100000.up,
    down: migration_20260814_100000.down,
    name: '20260814_100000',
  },
  {
    up: migration_20260814_110000.up,
    down: migration_20260814_110000.down,
    name: '20260814_110000',
  },
]
