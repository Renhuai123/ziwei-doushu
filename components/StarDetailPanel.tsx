'use client';
import { motion, AnimatePresence } from 'framer-motion';
import type { Star } from '@/lib/ziwei/types';
import { STAR_DETAIL_VI, AUX_STAR_DETAIL_VI } from '@/lib/i18n/star-details.vi';
import { viTerm } from '@/lib/i18n/vi';
import { STAR_DESCRIPTIONS } from '@/lib/ziwei/constants';

interface StarDetailPanelProps {
  star: Star | null;
  palaceName?: string;
  onClose: () => void;
}

// 倪海厦体系各星详细解读（参考顾祥弘《飞星紫微斗数全书》及南北山人《紫微斗数全书》）
const STAR_DETAIL: Record<string, {
  niHaixia: string;
  classical: string;
  bestPalace: string;
  worstPalace: string;
  career: string;
  relationship: string;
  wealth: string;
  health: string;
}> = {
  '紫微': {
    niHaixia: '倪师认为紫微是皇帝星，坐命宫者有孤傲之气，喜独处，不喜被人管辖。紫微需要左辅右弼相夹才能发挥帝王气质，否则只是孤君，富而不贵。紫微在辰戌宫最佳，与天府形成双星格局，财官双美，可出将入相。紫微最怕火星、铃星、擎羊、陀罗同宫，加煞则孤贵，有权而无财。',
    classical: '古诀：「紫微帝座临命主尊贵，统领众星，坐命者主权威显达。」南北山人注：「紫微守命于辰位，财官双美，出将入相，位至三公；子宫安命者，富贵不耐久，日后不美。」',
    bestPalace: '命宫（辰戌）、官禄宫',
    worstPalace: '疾厄宫、夫妻宫',
    career: '政界、管理层、独立创业，天生帝王气质，适合独当一面的领导岗位',
    relationship: '感情被动，自尊心强，需对方主动，有孤独倾向，晚婚则吉',
    wealth: '财运稳定，守成强于进取，辰戌位财官双美，最宜积累型投资',
    health: '土属性，注意脾胃、消化系统。忌过劳，宜保持规律作息',
  },
  '天机': {
    niHaixia: '倪师说天机是参谋星，最聪明的星，但聪明外漏则伤身。天机化忌最麻烦，代表聪明反被聪明误。天机属木，善变灵动，在命宫者思维敏捷，但往往多谋少决，需离开故乡远行才能发展，应事机变、随机应变是其最大特质。',
    classical: '古诀：「为人生精滑，自好作经营，天机星属木，商买皆多机见，离宗必远亲，机谋必远离亲。」南北山人注：「天机居庙旺地，主人生精明，善策划；居陷地则暗淡，人人皆从商为业。」',
    bestPalace: '命宫（卯位）、官禄宫',
    worstPalace: '夫妻宫',
    career: '技术专家、谋士、研究员、IT、策划，动脑胜于动手，适合离乡发展',
    relationship: '感情多变，想法太多，难以专一，宜晚婚，婚后需学会放下思虑',
    wealth: '靠智慧与技能赚钱，不擅守财，以专业技术为业则财运稳定',
    health: '木属性，注意肝胆、神经系统。心思过重易失眠，宜练习静心冥想',
  },
  '太阳': {
    niHaixia: '倪师认为太阳是大男人主义的星，在卯至午位入庙，光明正大；午后渐落陷。太阳坐命的人慷慨好面子，男命宜，女命太强势。太阳代表父亲与长辈，在命宫主人性格外向开朗，喜被众人看见，最宜公职或公众事业。落陷者先勤后懒，孤寡劳碌。',
    classical: '古诀：「太阳居午为入庙，光辉大放，主贵显，男命最佳；落陷则孤寡劳碌，先勤后懒。」南北山人注：「太阳在午宫守命，财官双美，出将入相；辰位安命，中年财官变美，乙年生人遇凶亦大利。」',
    bestPalace: '命宫（卯至午）、官禄宫',
    worstPalace: '夫妻宫（女命）、疾厄宫',
    career: '公职、政界、管理、公关、教育、传媒，喜欢站在众人面前，适合公众事业',
    relationship: '男命缘佳但花心，女命独立强势，婚姻需磨合，宜找温柔体贴的伴侣',
    wealth: '财运靠努力，慷慨好施，不擅积累；入庙财运旺，落陷财运起伏',
    health: '火属性，注意心脏、眼睛。落陷位时易过劳，需注意充分休息',
  },
  '武曲': {
    niHaixia: '倪师视武曲为财帛主星，刚硬不屈，最怕孤克。武曲坐命的人意志坚定，适合金融、理财，但感情上太直，容易伤人。武曲化忌要小心意外血光。武曲在辰戌丑未得旺地，与七杀同宫可成将财格，是极佳的财富格局。',
    classical: '古诀：「武曲属金，刚强之性，一生多刑克；守命于旺地，出将入相。」南北山人注：「武曲守命，三方四正俱吉，财官双美，武职加辅弼昌曲，亦主大贵；与七杀同宫，为将财格，主大富。」',
    bestPalace: '命宫（辰戌丑未）、财帛宫、官禄宫',
    worstPalace: '夫妻宫',
    career: '金融、军警、会计、工程，执行力极强，适合需要魄力与决断力的领域',
    relationship: '感情直来直往，缺乏情趣，需要温柔伴侣互补，忌感情孤克',
    wealth: '财星本命，财运极强，理财能力超群，辰戌位财官双美',
    health: '金属性，注意肺部、呼吸系统、牙齿。化忌时需防意外血光之灾',
  },
  '天同': {
    niHaixia: '倪师说天同是福星，最懒的星。天同坐命喜享福，不爱竞争，适合稳定工作。天同与天梁同宫最好，可以享福又有保障。天同化禄是最美的化禄，主一生衣食无忧，快乐悠游。天同忌落陷，落陷则福减，需与凶星化解。',
    classical: '古诀：「天同为福德之星，坐命者享福有余，主一生逍遥自在，不必劳苦。」南北山人注：「天同守命，三方无煞，一生快乐，衣食丰足；加吉星则富贵双全，为人温和，多人缘。」',
    bestPalace: '命宫、福德宫',
    worstPalace: '官禄宫',
    career: '服务业、娱乐、餐饮、文艺，轻松愉快的环境最适合，忌高压竞争',
    relationship: '感情温和，不主动，容易被动接受，婚姻较稳定，性格随和可亲',
    wealth: '财运不突出，靠稳定薪资，不擅投机，衣食无忧但难大富',
    health: '水属性，注意肾脏、膀胱。体质较弱，宜适度运动，保持轻松心态',
  },
  '廉贞': {
    niHaixia: '倪师认为廉贞是次桃花，才华横溢但感情复杂。廉贞化忌非常凶，代表官司、牢狱、意外。廉贞与天相同宫则化凶为吉，成为行政印绶之格。廉贞五行属火，性格刚烈，一生多起伏，才艺出众，若能守正不邪，可成大器。',
    classical: '古诀：「廉贞为次桃花，才华横溢，感情多波折；廉相同宫，化凶为吉，成行政印绶格，可掌权柄。」南北山人注：「廉贞守命，见吉星则才华出众，化忌则官司缠身，主血光之灾，须防。」',
    bestPalace: '官禄宫（配天相）、命宫（化禄时）',
    worstPalace: '命宫（化忌时）、夫妻宫',
    career: '艺术、娱乐、法律、公职（配天相），才艺出众，宜守正业方能长久',
    relationship: '桃花多，感情复杂，容易遭遇感情纠纷，宜晚婚，选择稳重伴侣',
    wealth: '财运起伏，靠才艺谋财，化忌时防财务纠纷与法律风险',
    health: '火属性，注意心脏、血液、肝脏。化忌时防意外与手术，留意血光',
  },
  '天府': {
    niHaixia: '倪师说天府是财库星，守成之星，不主动发财但能守住财富。天府坐命者稳重保守，女命最佳，能旺夫兴家。天府最喜紫微同宫或对照，形成双星格局，财官双美。天府怕空劫夹，见空劫则财库见底，守不住财。',
    classical: '古诀：「天府为财库之星，守命者稳重保守，主积财旺家；女命逢之，能旺夫益子，家道兴隆。」南北山人注：「天府守命，三方吉聚，财官双美，富贵安康；遇空劫，则财库破漏，难以积财。」',
    bestPalace: '命宫、财帛宫、田宅宫',
    worstPalace: '迁移宫',
    career: '行政管理、财务、保险、房地产，求稳不冒险，适合守成型职业',
    relationship: '感情稳定，顾家，是好的伴侣，注重家庭安全感与经济保障',
    wealth: '财运极佳，守财能力强，最适合积累型投资与不动产置业',
    health: '土属性，注意脾胃、消化。体质稳健，宜保持规律饮食与生活',
  },
  '太阴': {
    niHaixia: '倪师认为太阴是财星，利女命，也是男命母亲和妻子的代表星。太阴入庙则财运极佳，陷地则财运受阻。太阴化忌要注意女性亲人的问题。太阴在亥子位入庙，光辉全照，代表优雅细腻，感情丰富，重视内心世界与精神生活。',
    classical: '古诀：「太阴为财星，利女命；亥子入庙，光辉全照，财运极旺；午位落陷，忧郁多情，财运平淡。」南北山人注：「太阴守命，入庙者财富优厚，女命尤佳；落陷者需努力方能致富，情感细腻。」',
    bestPalace: '命宫（亥子）、财帛宫',
    worstPalace: '命宫（午位陷地）',
    career: '财务、金融、房地产、艺术、教育，细腻耐心，适合需要美感与温柔的职业',
    relationship: '感情温柔细腻，重视内心感受，需要有安全感的稳定关系',
    wealth: '入庙财运极旺，落陷则需努力；理财细心，善于积累，不擅冒险',
    health: '水属性，注意肾脏、子宫（女命）。情绪波动影响健康，宜保持心情舒畅',
  },
  '贪狼': {
    niHaixia: '倪师说贪狼是最多才多艺的星，桃花最重。贪狼化禄入命则魅力四射，人见人爱。贪狼属晚发之星，中年后才能真正发达。贪狼在寅申位入庙最佳，桃花旺盛，才艺超群；化禄后财运大发，但若遇空劫则一生多波折，难聚财。',
    classical: '古诀：「贪狼发福亨通，多才多艺，桃花最重；然难过三十岁，晚发者众。落陷遇煞反吉，此系贪狼落陷之理。」南北山人注：「贪狼守命，遇吉则福禄多寿，发福亨通；但久后不得善终，故宜修身养德，方可善终。」',
    bestPalace: '命宫（化禄）、福德宫、迁移宫',
    worstPalace: '疾厄宫',
    career: '艺术、娱乐、公关、销售、风水五术，靠人脉与才艺，多才多艺型',
    relationship: '桃花极旺，感情多元化，宜晚婚，婚后需克制桃花方能白首偕老',
    wealth: '靠人脉和才艺赚钱，财运中晚年才稳，化禄后财源广进，早年宜稳守',
    health: '木属性（含水），注意肝脏、肾脏。桃花过旺易耗损精力，宜节制调养',
  },
  '巨门': {
    niHaixia: '倪师认为巨门是口舌是非星，但化禄化权后转吉，变成靠口才赚钱的格局。巨门坐命多疑，善辩，适合律师、教师、销售。巨门最忌化忌，主口舌是非不断，甚至引发诉讼。巨门在子午位较佳，口才好，主以言语立身。',
    classical: '古诀：「巨门为暗曜，主口舌是非；化禄权则转为以口才谋生，主富贵。」南北山人注：「巨门守命，逢化禄权，以口舌为业者大吉；化忌则口舌连累，官司缠身，需谨慎言语。」',
    bestPalace: '官禄宫（化禄权）、命宫（子午）',
    worstPalace: '夫妻宫、疾厄宫（化忌）',
    career: '律师、教师、销售、主持人、谈判专家，口才是核心竞争力',
    relationship: '多疑多虑，容易想太多，沟通是婚姻关键，需选有耐心的伴侣',
    wealth: '靠口才和专业技能赚钱，化禄后财运较佳，化忌防财务纠纷口舌连累',
    health: '水属性，注意肾脏、耳朵、口腔。多思多虑易伤身，宜学习放松减压',
  },
  '天相': {
    niHaixia: '倪师说天相是印绶星，负责行政庶务。天相坐命者中规中矩，适合公职行政。天相最需要有强星相配才能发挥，单独坐命较平淡。天相最喜廉贞相伴，形成廉相格，可主行政大权；最怕破军同宫，形成刑忌夹印格，主凶险。',
    classical: '古诀：「天相为印绶之星，主行政庶务；廉相同宫，化凶为吉，掌行政大权。」南北山人注：「天相守命，中规中矩，适合公职；得廉贞相配，可成国家栋梁；破军同守，则刑克难免。」',
    bestPalace: '官禄宫、命宫（配廉贞）',
    worstPalace: '财帛宫、命宫（配破军则刑忌夹印）',
    career: '公职、行政管理、秘书、助理，擅长辅助支持型角色，需要强星引路',
    relationship: '感情稳定，忠厚老实，是好的伴侣，但需要对方主导方向',
    wealth: '财运平稳，靠薪资积累，不适合冒险投资，守成型理财最宜',
    health: '水属性，注意肾脏、淋巴系统。体质中等，宜保持规律生活习惯',
  },
  '天梁': {
    niHaixia: '倪师认为天梁是荫星，能保护别人，也代表医药宗教。天梁坐命者有长辈缘，早年多磨难，晚年享福。天梁最怕化忌，代表长辈或健康有问题。天梁与太阳同宫最佳，日月并明，贵人庇荫，一生有贵人相助，终得平安。',
    classical: '古诀：「天梁为荫星，主庇荫保护；坐命者有长辈缘，早年受磨练，晚年享清福。」南北山人注：「天梁守命，须逢吉星方能发达；遇太阳同宫，日月并明，主贵显，一生多贵人相助。」',
    bestPalace: '命宫、父母宫、福德宫',
    worstPalace: '命宫（化忌时）、财帛宫',
    career: '医疗、宗教、法律、社工、慈善，喜帮助别人，有荫庇众人之心',
    relationship: '感情多与年龄差距较大者，或缘分晚来，需等待耐心方得良缘',
    wealth: '财运靠贵人相助，早年财运不佳，晚年财运才稳固，宜守不宜冲',
    health: '土属性，注意脾胃、骨骼。需重视老年健康保健，宜早做预防调养',
  },
  '七杀': {
    niHaixia: '倪师说七杀是将军星，果决冲劲强，但有孤克之性。七杀坐命必须有辅星化解孤性，否则六亲缘薄。七杀与武曲同宫是将财格，极佳。七杀最怕竹罗三限（羊陀火铃齐照），主大凶，须防意外。七杀化禄后反为吉，可成大将之材。',
    classical: '古诀：「七杀为将军之星，果决冲劲强；守命者孤克性重，六亲缘薄。」南北山人注：「七杀守命，三合吉聚则大贵；遇竹罗三限（羊陀火铃），主大凶，防意外之灾，防刑克。」',
    bestPalace: '命宫（有辅星）、官禄宫',
    worstPalace: '夫妻宫、父母宫',
    career: '军警、创业、金融交易、独当一面的领域，需要快速决断与魄力',
    relationship: '感情孤克，难找合适伴侣，需要能包容强势个性的对象，宜晚婚',
    wealth: '财运波动大，有机会大富，也有大起大落；武曲同宫可成将财格大贵',
    health: '金属性，注意肺部、大肠。性情急躁易伤身，宜学习控制情绪与修身',
  },
  '破军': {
    niHaixia: '倪师说破军是最能破旧立新的星，也是最孤克的星之一。破军化禄后才变好，代表能破而后立。破军坐命六亲缘薄，但开创能力极强。破军最适合改革、创新；化禄时财运转旺，一破一立，终能成就事业。',
    classical: '古诀：「破军为最能破旧立新之星，坐命者孤克，六亲缘薄，然开创能力超强；化禄后破而后立，可成大业。」南北山人注：「破军守命，一生多波折；化禄者，破财之后方能重建，财运终归好转，主晚年成就。」',
    bestPalace: '官禄宫（化禄）、迁移宫',
    worstPalace: '夫妻宫、父母宫',
    career: '开创型事业、军警、改革、变革管理，适合不断开拓新领域的先驱型工作',
    relationship: '感情多波折，离合不定，六亲缘薄，需选择独立且包容力强的伴侣',
    wealth: '财运起伏大，化禄后财运转好；守成则财退，需不断开创新局才能积财',
    health: '水属性，注意肾脏、膀胱、生殖系统。体质起伏，宜保持规律运动习惯',
  },
};

const levelConfig = {
  major: { label: 'Chính tinh', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  lucky: { label: 'Cát tinh', color: 'text-sky-400 border-sky-500/30 bg-sky-500/10' },
  sha:   { label: 'Sát tinh', color: 'text-red-400 border-red-500/30 bg-red-500/10' },
  minor: { label: 'Tạp diệu', color: 'text-slate-400 border-slate-500/25 bg-slate-500/10' },
};

const siHuaColors: Record<string, string> = {
  '禄': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  '权': 'text-blue-400 bg-blue-500/10 border-blue-500/30',
  '科': 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
  '忌': 'text-red-400 bg-red-500/10 border-red-500/30',
};

export default function StarDetailPanel({ star, palaceName, onClose }: StarDetailPanelProps) {
  const desc = star ? STAR_DESCRIPTIONS[star.name] : null;
  const detail = star ? STAR_DETAIL_VI[star.name] ?? STAR_DETAIL[star.name] : null;
  const typeConfig = star ? levelConfig[star.type] : null;

  return (
    <AnimatePresence>
      {star && (
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
          transition={{ duration: 0.2 }}
          className="card-glass rounded-xl overflow-hidden"
        >
          {/* 标题栏 */}
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--t-border)' }}>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold" style={{ color: 'var(--t-gold)' }}>{viTerm(star.name)}</span>
              {typeConfig && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${typeConfig.color}`}>
                  {typeConfig.label}
                </span>
              )}
              {star.siHua && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full border font-medium ${siHuaColors[star.siHua] || ''}`}>
                  Hóa {viTerm(star.siHua)}
                </span>
              )}
            </div>
            <button onClick={onClose} className="transition-colors text-lg leading-none" style={{ color: 'var(--t-faint)' }}>×</button>
          </div>

          <div className="p-4 space-y-4 overflow-y-auto max-h-[560px]">
            {/* 基本信息 */}
            {desc && (
              <div className="flex flex-wrap gap-1.5">
                {[
                  `Ngũ hành · ${viTerm(desc.element)}`,
                  `Tính chất · ${viTerm(desc.nature)}`,
                  ...(palaceName ? [`Vị trí · ${viTerm(palaceName)}`] : []),
                  ...(star.brightness ? [star.brightness === 'bright' ? 'Miếu vượng' : star.brightness === 'dim' ? 'Lạc hãm' : 'Bình hòa'] : []),
                ].map(tag => (
                  <div key={tag} className="text-[10px] px-2 py-1 rounded-full"
                    style={{
                      border: '1px solid var(--t-border)',
                      color: tag.includes('Miếu vượng') ? '#eab308' : tag.includes('Lạc hãm') ? '#ef4444' : 'var(--t-text2)',
                    }}>
                    {tag}
                  </div>
                ))}
              </div>
            )}

            {/* 关键词 */}
            {desc && (
              <div>
                <div className="text-[10px] tracking-widest mb-1.5" style={{ color: 'var(--t-faint)' }}>Đặc tính sao</div>
                <div className="flex flex-wrap gap-1.5">
                  {desc.keywords.split('·').map(k => (
                    <span key={k} className="text-[11px] px-2 py-0.5 rounded-full"
                      style={{ color: 'var(--t-gold)', border: '1px solid rgba(212,168,67,0.2)', background: 'rgba(212,168,67,0.06)' }}>
                      {viTerm(k.trim())}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Cổ thư · bản dịch tiếng Việt */}
            {detail && (
              <div className="rounded-xl p-3" style={{ background: 'rgba(212,168,67,0.04)', border: '1px solid rgba(212,168,67,0.12)' }}>
                <div className="text-[10px] tracking-widest mb-1.5 flex items-center gap-1" style={{ color: 'var(--t-gold)', opacity: 0.7 }}>
                  Cổ thư · bản dịch tiếng Việt
                </div>
                <p className="text-[11px] leading-relaxed italic" style={{ color: 'var(--t-gold)', opacity: 0.8 }}>{detail.classical}</p>
              </div>
            )}

            {/* 倪海厦解读 */}
            {detail && (
              <>
                <div>
                  <div className="text-[10px] tracking-widest mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--t-faint)' }}>
                    <span className="w-3 h-px inline-block" style={{ background: 'var(--t-border-acc)' }} />
                    Luận giải theo Nghê Hải Hạ
                    <span className="w-3 h-px inline-block" style={{ background: 'var(--t-border-acc)' }} />
                  </div>
                  <p className="text-xs leading-relaxed" style={{ color: 'var(--t-text2)' }}>{detail.niHaixia}</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {[
                    { label: 'Hướng sự nghiệp', value: detail.career, icon: '◈' },
                    { label: 'Đặc điểm tình cảm', value: detail.relationship, icon: '♡' },
                    { label: 'Phân tích tài vận', value: detail.wealth, icon: '◆' },
                    { label: 'Lưu ý sức khỏe', value: detail.health, icon: '☯' },
                  ].map(item => (
                    <div key={item.label} className="card-inner rounded-lg p-3">
                      <div className="text-[10px] mb-1 flex items-center gap-1" style={{ color: 'var(--t-faint)' }}>
                        <span>{item.icon}</span>
                        <span>{item.label}</span>
                      </div>
                      <p className="text-[11px] leading-relaxed" style={{ color: 'var(--t-text2)' }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="text-[10px] p-2.5 rounded-lg" style={{ border: '1px solid rgba(74,222,128,0.15)', background: 'rgba(74,222,128,0.05)' }}>
                    <div className="text-emerald-500 mb-0.5 font-medium">Cung thuận lợi</div>
                    <div className="text-emerald-500/70">{detail.bestPalace}</div>
                  </div>
                  <div className="text-[10px] p-2.5 rounded-lg" style={{ border: '1px solid rgba(248,113,113,0.15)', background: 'rgba(248,113,113,0.05)' }}>
                    <div className="text-red-500 mb-0.5 font-medium">Cung cần lưu ý</div>
                    <div className="text-red-500/70">{detail.worstPalace}</div>
                  </div>
                </div>
              </>
            )}

            {/* 辅星/Sát tinh说明 */}
            {!detail && star.type !== 'major' && (
              <div className="text-xs leading-relaxed" style={{ color: 'var(--t-text2)' }}>
                {star.type === 'lucky' && (
                  <>
                    {star.name === '文昌' && (AUX_STAR_DETAIL_VI[star.name] ?? "文昌入宫，主学业考试顺利，文书印鉴有利，宜从事文字相关工作。古诀：「文昌科甲，主文章显达，逢考必第。」")}
                    {star.name === '文曲' && (AUX_STAR_DETAIL_VI[star.name] ?? "文曲入宫，主才艺出众，口才佳，善于表达，艺术天赋强。古诀：「文曲为才艺之星，能文能武，口才胜人。」")}
                    {star.name === '左辅' && (AUX_STAR_DETAIL_VI[star.name] ?? "左辅入宫，主贵人相助，有人提携，该宫位事项受到善意支持。古诀：「左辅为助力之星，坐命则贵人多，逢凶化吉。」")}
                    {star.name === '右弼' && (AUX_STAR_DETAIL_VI[star.name] ?? "右弼入宫，主贵人相助，多出女性贵人，该宫位事项有人协助。古诀：「右弼为阴助之星，多女性贵人，化险为夷。」")}
                    {star.name === '天魁' && (AUX_STAR_DETAIL_VI[star.name] ?? "天魁入宫，主白天出生的贵人，男性贵人多，逢凶化吉之力。古诀：「天魁为天乙贵人，逢之必有贵人扶持。」")}
                    {star.name === '天钺' && (AUX_STAR_DETAIL_VI[star.name] ?? "天钺入宫，主夜晚出生的贵人，女性贵人多，增添吉祥之气。古诀：「天钺为玉堂贵人，主阴助，女贵人多。」")}
                    {star.name === '禄存' && (AUX_STAR_DETAIL_VI[star.name] ?? "禄存入宫，主财禄守成，该宫位有财气，但属于保守型财运。古诀：「禄存为财禄之星，主守财有余，进财稳健。」")}
                    {star.name === '天马' && (AUX_STAR_DETAIL_VI[star.name] ?? "天马入宫，主奔波动荡，动中求财，宜主动出击，不宜守株待兔。古诀：「天马主动，逢禄则财禄双全，动中生财。」")}
                  </>
                )}
                {star.type === 'sha' && (
                  <>
                    {star.name === '地空' && (AUX_STAR_DETAIL_VI[star.name] ?? "地空入宫，主该宫位事项有落空感，精神耗散，宜注意心理健康。古诀：「地空主虚耗，入命宫者多精神迷茫，须防空想。」")}
                    {star.name === '地劫' && (AUX_STAR_DETAIL_VI[star.name] ?? "地劫入宫，主该宫位事项有意外损失，财物需谨慎，防小人。古诀：「地劫主劫财，入命宫者财运受损，防意外之失。」")}
                    {star.name === '火星' && (AUX_STAR_DETAIL_VI[star.name] ?? "火星入宫，主该宫位事项急躁冲动，情绪波动，但若遇贪狼则反吉。古诀：「火星主急燥，然遇贪狼同宫，反为火贪格，主暴发。」")}
                    {star.name === '铃星' && (AUX_STAR_DETAIL_VI[star.name] ?? "铃星入宫，主该宫位事项有暗中阻碍，防背后小人，凡事宜低调。古诀：「铃星主暗煞，入命者多暗中受敌，须防背后是非。」")}
                    {star.name === '擎羊' && (AUX_STAR_DETAIL_VI[star.name] ?? "擎羊入宫，主刑克，该宫位事项多波折，有血光之灾或意外。古诀：「擎羊为刑克之星，入命宫者多刑克，须防意外血光。」")}
                    {star.name === '陀罗' && (AUX_STAR_DETAIL_VI[star.name] ?? "陀罗入宫，主是非缠身，该宫位事项拖延不决，凡事宜早做准备。古诀：「陀罗主是非拖延，入命宫者做事迟缓，须防纠缠不清。」")}
                  </>
                )}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
