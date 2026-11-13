"""两家看图接口配置（实验 3、4 共用）。DeepSeek 开思考；Kimi K3.1 Pro 思考关不掉，用 reasoning_effort=low。"""
CFG = {
    'deepseek': ('https://api.deepseek.com/chat/completions', 'deepseek-flash', '~/.config/nishi-study/deepseek.key',
                 {'thinking': {'type': 'enabled'}, 'max_tokens': 16000}),
    # 实验 3 复盘：高档思考在看不清的板书上会把 16000 token 想完仍交白卷，改用低档
    'deepseek低': ('https://api.deepseek.com/chat/completions', 'deepseek-flash', '~/.config/nishi-study/deepseek.key',
                 {'thinking': {'type': 'enabled'}, 'reasoning_effort': 'low', 'max_tokens': 16000}),
    'kimi': ('https://api.moonshot.cn/v1/chat/completions', 'kimi-k3.1-pro', '~/.config/nishi-study/kimi.key',
             {'reasoning_effort': 'low', 'max_tokens': 16000}),
    # 实验 4 重测（11-08 站长批 ¥60）：指代要看得细，思考提到高档
    'kimi高': ('https://api.moonshot.cn/v1/chat/completions', 'kimi-k3.1-pro', '~/.config/nishi-study/kimi.key',
             {'reasoning_effort': 'high', 'max_tokens': 32000}),
}
