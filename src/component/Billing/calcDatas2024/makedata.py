import pandas as pd
import sys
import json

# 引数からファイル名を取得
input_file = sys.argv[1]

# CSVを読み込む
# data = pd.read_csv(input_file, skiprows=1)
data = pd.read_csv(input_file, skiprows=1, na_filter=False)

# 変数名をCSVの1行目から取得
with open(input_file, 'r') as file:
    variable_name = file.readline().strip().replace(',', '')

def process_data(row):
    result = {}
    for col, value in row.items():
        # 空欄またはnullの場合はスキップ
        if pd.isna(value) or value == 'null' or value == '':
            continue

        # カラム名と型指定の分離
        if ':' in col:
            col, type_hint = col.split(':')
            if type_hint == 'str':
                value = str(value)  # 型指定に従って文字列に変換
        else:
            type_hint = None

        # 真偽値の変換
        if value == 'TRUE':
            value = True
        elif value == 'FALSE':
            value = False

        # 型指定がなければ数値の処理を行う
        if not type_hint and isinstance(value, str) and value.replace('.', '', 1).replace(',', '').isdigit():
            value = value.replace(',', '')
            if '.' in value:
                value = float(value)
            else:
                value = int(value)

        # ネストされたオプションの処理
        keys = col.split('.')
        current = result
        for k in keys[:-1]:
            if k not in current:
                current[k] = {}
            current = current[k]

        # 最終キーの値を設定（空の場合は含めない）
        if value != '':
            current[keys[-1]] = value

    # 空のネストされた辞書を削除
    keys_to_delete = [key for key, val in result.items() if isinstance(val, dict) and not val]
    for key in keys_to_delete:
        del result[key]

    return result


# データ変換
processed_data = data.apply(process_data, axis=1)

# JavaScript形式で出力
js_output = f'export const {variable_name} = [\n'
js_output += ',\n'.join(json.dumps(item, ensure_ascii=False) for item in processed_data)
js_output += '\n]'

# 結果を標準出力に出力
print(js_output)
