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
        }>,
      },
    },
  }

  interface ActorTplClass {
    name: BlackFlagItem['name'],
    levels: number,
    _id: BlackFlagItem['_id'],
    img: BlackFlagItem['img'],
  }

  interface ActorTplSkill {
    name: string,
    mod: number,
    label: string,
    isHighest?: boolean;
  }

  interface ActorTplHighSkill {
    label: string,
    mod: string,
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
    senses: BlackFlagActor['system']['progression']['traits']['senses']['label'] | null,
    type: BlackFlagActor['system']['progression']['traits']['type']['label'] | null,
    size: BlackFlagActor['system']['progression']['traits']['size'] | null,
    movement: BlackFlagActor['system']['progression']['traits']['movement']['labels'],
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
}