import BombPartyDictionary from './BombPartyDictionary';

describe('BombPartyDictionary', () => {
  let dictionary: BombPartyDictionary;
  const somewords = ['hello', 'world', 'albatross', 'motorcycle', 'quantify', 'capricious'];
  const somemorewords = ['holy', 'cow', 'this', 'dictionary', 'is', 'amazing'];
  const notsomewords = ['hackscalope', 'bifolograph', 'pildarbism', 'winstaplory'];
  beforeEach(() => {
    dictionary = new BombPartyDictionary();
  });
  test('should be able to validate and invalidate if a word is in the english language', () => {
    somewords.forEach(word => {
      expect(dictionary.validateWord(word)).toBeTruthy();
    });
    somemorewords.forEach(word => {
      expect(dictionary.validateWord(word)).toBeTruthy();
    });
    notsomewords.forEach(word => {
      expect(dictionary.validateWord(word)).toBeFalsy();
    });
  });
  test('should invalidate otherwise valid words if they have been used before', () => {
    somewords.forEach(word => {
      dictionary.addWordToHistory(word);
    });
    somewords.forEach(word => {
      expect(dictionary.validateWord(word)).toBeFalsy();
    });
    somemorewords.forEach(word => {
      expect(dictionary.validateWord(word)).toBeTruthy();
    });
  });
  test('should be able to generate a random substring derived from an english word', () => {
    const unlikelyPrompts = [
      'bk',
      'fq',
      'jc',
      'jt',
      'mj',
      'qh',
      'qx',
      'vj',
      'wz',
      'zh',
      'bq',
      'fv',
      'jd',
      'jv',
      'mq',
      'qj',
      'qy',
      'vk',
      'xb',
      'zj',
      'bx',
      'fx',
      'jf',
      'jw',
      'mx',
      'qk',
      'qz',
      'vm',
      'xg',
      'zn',
      'cb',
      'fz',
      'jg',
      'jx',
      'mz',
      'ql',
      'sx',
      'vn',
      'xj',
      'zq',
      'cf',
      'gq',
      'jh',
      'jy',
      'pq',
      'qm',
      'sz',
      'vp',
      'xk',
      'zr',
      'cg',
      'gv',
      'jk',
      'jz',
      'pv',
      'qn',
      'tq',
      'vq',
      'xv',
      'zs',
      'cj',
      'gx',
      'jl',
      'kq',
      'px',
      'qo',
      'tx',
      'vt',
      'xz',
      'zx',
      'cp',
      'hk',
      'jm',
      'kv',
      'qb',
      'qp',
      'vb',
      'vw',
      'yq',
      'cv',
      'hv',
      'jn',
      'kx',
      'qc',
      'qr',
      'vc',
      'vx',
      'yv',
      'cw',
      'hx',
      'jp',
      'kz',
      'qd',
      'qs',
      'vd',
      'vz',
      'yz',
      'cx',
      'hz',
      'jq',
      'lq',
      'qe',
      'qt',
      'vf',
      'wq',
      'zb',
      'dx',
      'iy',
      'jr',
      'lx',
      'qf',
      'qv',
      'vg',
      'wv',
      'zc',
      'fk',
      'jb',
      'js',
      'mg',
      'qg',
      'qw',
      'vh',
      'wx',
      'zg',
    ];
    for (let i = 0; i < 100; i++) {
      const prompt = dictionary.generateSubstring();
      expect(prompt.length === 2 || prompt.length === 3).toBeTruthy();
      expect(unlikelyPrompts).not.toContain(prompt); // uncertain
    }
  });
});
