import type { EmbeddedCollection } from '@league-of-foundry-developers/foundry-vtt-types/src/foundry/common/abstract/module.d.mts';

declare global {
  interface BlackFlagItem extends Item {
    system: {
      identifier: string,
      quantity: number,
    },
  }

  interface BlackFlagActor extends Actor {
    items: EmbeddedCollection<BlackFlagItem, BlackFlagActor>,
    system: {
      attributes: {
        ac: {
          value: number,
          label: string,
        },
        cr?: number,
        attunement: {
          max: number,
          value: number,
        },
        hd: {
          max: number,
          available: number,
        },
        hp: {
          max: number,
          value: number,
          temp: number,
        },
        luck: {
          value: number,
        },
        exhaustion: 0 | 1 | 3 | 4 | 5,
        death: {
          failure: 0 | 1 | 2 | 3,
          success: 0 | 1 | 2 | 3,
        }
      },
      progression: {
        classes: Record<string, {
          document: BlackFlagItem,
          levels: number,
          originalClass: boolean
        }>,
        xp: {
          max: number,
          value: number,
          percentage: number,
        },
        background: BlackFlagItem,
        heritage: BlackFlagItem,
        lineage: BlackFlagItem,
      },
      traits: {
        senses: {
          label: string,
        },
        size: 'tiny' | 'small' | 'medium' | 'large' | 'huge' | 'gargantuan'
        type: {
          label: string,
        },
        movement: {
          label: string,
          labels: string,
          tags: Set<string>,
          types: {
            walk: number,
            climb: number,
            fly: number,
            swim: number,
            burrow: number,
          },
        },
      },
      proficiencies: {
        skills: Record<string, {
          labels: {
            ability: string,
            name: string,
          },
          mod: number,
          proficiency: {
            multiplier: ProficiencyLevel,
          }
        }>,
      },

      addLuck: () => Promise<void>,
    },
  }

  interface BlackFlagTokenDocument extends TokenDocument {
    actor: BlackFlagActor;
  }

  interface ActorTplClass {
    name: BlackFlagItem['name'],
    levels: number,
    _id: BlackFlagItem['_id'],
    img: BlackFlagItem['img'],
  }

  type ProficiencyLevel = 0 | 0.5 | 1 | 2;

  interface ActorTplSkill {
    name: string,
    mod: number,
    label: string,
    proficiencyLevel: ProficiencyLevel,
    isHighest?: boolean,
  }

  interface ActorTplHighSkill {
    label: string,
    mod: string,
    proficiencyLevel: ProficiencyLevel,
  }

  interface ActorTplData {
    _id: BlackFlagActor['_id'],
    img: BlackFlagActor['img'],
    name: BlackFlagActor['name'],
    ac: {
      value: number,
      label: string,
    },
    attunement: BlackFlagActor['system']['attributes']['attunement'],
    hd: {
      max: BlackFlagActor['system']['attributes']['hd']['max'],
      available: BlackFlagActor['system']['attributes']['hd']['available'],
    },
    hp: {
      max: BlackFlagActor['system']['attributes']['hp']['max'],
      value: BlackFlagActor['system']['attributes']['hp']['value'],
      thp: BlackFlagActor['system']['attributes']['hp']['temp'],
    },
    luck: BlackFlagActor['system']['attributes']['luck']['value'],
    classes: ActorTplClass[],
    skills: ActorTplSkill[],
    highestSkills: ActorTplHighSkill[],
    xp: BlackFlagActor['system']['progression']['xp'],
    background: BlackFlagActor['system']['progression']['background'],
    heritage: BlackFlagActor['system']['progression']['heritage'],
    lineage: BlackFlagActor['system']['progression']['lineage'],
    coinage: string,
    wealth: string,
    senses: BlackFlagActor['system']['progression']['traits']['senses']['label'] | null,
    type: BlackFlagActor['system']['progression']['traits']['type']['label'] | null,
    size: BlackFlagActor['system']['progression']['traits']['size'] | null,
    movement: BlackFlagActor['system']['progression']['traits']['movement']['labels'],

    isOwner: boolean,
  }

  interface PCSheetData {
    actor: BlackFlagActor,
    owner: boolean,
  }

  interface CurrencyManagementFormData {
    platinum: number,
    gold: number,
    silver: number,
    copper: number,
    transaction: 'receive' | 'spend' | 'transfer',
    actors?: BlackFlagActor['id'],
  }

  interface Coinage {
    pp: number,
    gp: number,
    sp: number,
    cp: number,
  }

  interface CONFIG {
    BlackFlag: {
      luck: {
        max: number;
      };
    };
  }

  interface Window {
    dragRuler?: {
      registerModule: (moduleId: string, api: Constructor) => void;
      [key: string]: unknown;
    };
  }
}