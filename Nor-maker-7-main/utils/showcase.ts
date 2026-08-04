import { GameObject } from '../types';

export const createShowcaseTemplate = (): GameObject[] => {
    return [
        {
            id: 'obj_player',
            name: 'obj_player',
            spriteId: 'spr_player',
            events: {
                'create': [
                    { id: '1', libId: 'move_gravity', params: { amt: 0.5 } },
                    { id: '2', libId: 'control_var', params: { name: 'health', val: '100', rel: false } }
                ],
                'step': [
                    { id: '3', libId: 'control_if_key', params: { key: 'ArrowRight', press: true } },
                    { id: '4', libId: 'move_hspeed', params: { spd: 3 } },
                    { id: '5', libId: 'control_if_key', params: { key: 'ArrowLeft', press: true } },
                    { id: '6', libId: 'move_hspeed', params: { spd: -3 } },
                    { id: '7', libId: 'control_if_key', params: { key: 'Space', press: true } },
                    { id: '8', libId: 'move_vspeed', params: { spd: -8 } }
                ],
                'collision_enemy': [
                    { id: '9', libId: 'extra_shake', params: { amt: 10, dur: 20 } },
                    { id: '10', libId: 'extra_particles', params: { count: 20, col: '#FF0000' } },
                    { id: '11', libId: 'combat_damage', params: { amt: 10, target: 'self' } }
                ]
            }
        },
        {
            id: 'obj_score_display',
            name: 'obj_score_display',
            spriteId: null,
            events: {
                'draw': [
                    { id: '12', libId: 'score_draw', params: { x: 10, y: 10, cap: 'Score: ' } }
                ]
            }
        }
    ];
};
