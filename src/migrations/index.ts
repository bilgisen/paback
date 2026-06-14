import * as migration_20250929_111647 from './20250929_111647'
import * as migration_20260508_215307 from './20260508_215307'

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
]
