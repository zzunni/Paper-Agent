# c:\Users\USER\Desktop\paper-draft-agent\실험.py
import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

def main():
    model_name = "LGAI-EXAONE/EXAONE-4.0-1.2B"

    # ✅ tokenizer 먼저 (pad/eos 처리용)
    tokenizer = AutoTokenizer.from_pretrained(model_name, use_fast=False)

    # pad_token이 없는 모델이면 generate에서 경고/오류가 날 수 있어 방지
    if tokenizer.pad_token_id is None:
        # eos_token이 없으면(드물지만) bos로 대체
        if tokenizer.eos_token_id is None and tokenizer.bos_token_id is not None:
            tokenizer.eos_token = tokenizer.bos_token
        tokenizer.pad_token = tokenizer.eos_token

    # ✅ dtype: bfloat16은 GPU에서 지원되는 경우가 많지만,
    # 환경에 따라 float16이 더 안전할 수 있음.
    # 우선 네 코드 의도대로 bfloat16 유지하되, 문제 생기면 float16로 바꿔.
    model = AutoModelForCausalLM.from_pretrained(
        model_name,
        torch_dtype=torch.bfloat16,   # ✅ 문자열 말고 torch dtype 권장
        device_map="auto"
    )
    model.eval()

    # choose your prompt
    prompt = "너가 얼마나 대단한지 설명해 봐"

    messages = [{"role": "user", "content": prompt}]

    # ✅ apply_chat_template는 보통 Tensor를 돌려줌.
    # 그런데 환경/버전 조합에 따라 BatchEncoding 비슷한 타입이 나오면
    # generate에서 shape 접근이 깨질 수 있어 방어적으로 처리.
    enc = tokenizer.apply_chat_template(
        messages,
        tokenize=True,
        add_generation_prompt=True,
        return_tensors="pt"
    )

    # ✅ enc가 Tensor면 그대로, dict/BatchEncoding이면 input_ids로 꺼내기
    if isinstance(enc, torch.Tensor):
        input_ids = enc
        attention_mask = None
    else:
        # 일부 토크나이저는 dict 형태로 반환할 수 있음
        input_ids = enc["input_ids"]
        attention_mask = enc.get("attention_mask", None)

    input_ids = input_ids.to(model.device)
    if attention_mask is not None:
        attention_mask = attention_mask.to(model.device)

    with torch.no_grad():
        output_ids = model.generate(
            input_ids=input_ids,
            attention_mask=attention_mask,
            max_new_tokens=1008,
            do_sample=False,
            eos_token_id=tokenizer.eos_token_id,
            pad_token_id=tokenizer.pad_token_id,
        )

    # ✅ 프롬프트까지 포함된 전체를 디코딩하면 길어서,
    # 생성된 부분만 잘라서 출력하는 게 보통 더 보기 좋음.
    gen_ids = output_ids[0, input_ids.shape[1]:]
    print(tokenizer.decode(gen_ids, skip_special_tokens=True))

if __name__ == "__main__":
    main()
