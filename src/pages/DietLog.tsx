import { useState } from 'react'
import { useStore } from '../store'
import { MealEntry, FoodItem, MealType, MEAL_LABELS, MEAL_EMOJIS, COMMON_FOODS } from '../types'
import { todayStr } from '../lib/calculations'

export default function DietLog() {
  const { meals, removeMeal, addMeal, profile } = useStore()
  const [showModal, setShowModal] = useState(false)
  const [mealType, setMealType] = useState<MealType>('breakfast')
  const [foods, setFoods] = useState<FoodItem[]>([])
  const [notes, setNotes] = useState('')
  const [showFoodSearch, setShowFoodSearch] = useState(false)
  const [search, setSearch] = useState('')
  const [customFood, setCustomFood] = useState({ name: '', calories: '', protein: '', carbs: '', fat: '' })
  const [showCustom, setShowCustom] = useState(false)
  const [viewDate, setViewDate] = useState(todayStr())

  const dateMeals = meals.filter((m) => m.date === viewDate)
  const totalCal = dateMeals.reduce((s, m) => s + m.totalCalories, 0)
  const totalProtein = dateMeals.reduce((s, m) => s + m.foods.reduce((fs, f) => fs + f.protein, 0), 0)
  const totalCarbs = dateMeals.reduce((s, m) => s + m.foods.reduce((fs, f) => fs + f.carbs, 0), 0)
  const totalFat = dateMeals.reduce((s, m) => s + m.foods.reduce((fs, f) => fs + f.fat, 0), 0)

  const filteredFoods = COMMON_FOODS.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  )

  const addCommonFood = (food: typeof COMMON_FOODS[0]) => {
    setFoods((prev) => [
      ...prev,
      { id: Date.now().toString(), ...food },
    ])
    setShowFoodSearch(false)
    setSearch('')
  }

  const addCustomFoodItem = () => {
    if (!customFood.name || !customFood.calories) return
    setFoods((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        name: customFood.name,
        calories: +customFood.calories,
        protein: +customFood.protein || 0,
        carbs: +customFood.carbs || 0,
        fat: +customFood.fat || 0,
        amount: 1,
        unit: '份',
      },
    ])
    setCustomFood({ name: '', calories: '', protein: '', carbs: '', fat: '' })
    setShowCustom(false)
  }

  const removeFood = (id: string) => setFoods((prev) => prev.filter((f) => f.id !== id))

  const saveMeal = () => {
    if (foods.length === 0) return
    const meal: MealEntry = {
      id: Date.now().toString(),
      date: viewDate,
      type: mealType,
      foods,
      totalCalories: foods.reduce((s, f) => s + f.calories, 0),
      notes,
    }
    addMeal(meal)
    setFoods([])
    setNotes('')
    setShowModal(false)
  }

  const openModal = (type: MealType) => {
    setMealType(type)
    setFoods([])
    setNotes('')
    setShowModal(true)
  }

  const today = todayStr()

  return (
    <div className="page-container">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-xl font-bold text-gray-800">飲食紀錄</h1>
        <div className="flex gap-2">
          <button
            onClick={() => setViewDate(prev => {
              const d = new Date(prev)
              d.setDate(d.getDate() - 1)
              return d.toISOString().slice(0, 10)
            })}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600"
          >
            ‹
          </button>
          <span className="text-sm text-gray-500 self-center">
            {viewDate === today ? '今天' : viewDate.slice(5).replace('-', '/')}
          </span>
          <button
            onClick={() => setViewDate(prev => {
              const d = new Date(prev)
              d.setDate(d.getDate() + 1)
              return d.toISOString().slice(0, 10)
            })}
            disabled={viewDate >= today}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 disabled:opacity-30"
          >
            ›
          </button>
        </div>
      </div>

      {/* Calorie Summary */}
      <div className="card mb-4 bg-gradient-to-r from-orange-400 to-rose-400 text-white border-0">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-orange-100 text-sm">總攝取</p>
            <p className="text-3xl font-bold">{totalCal}</p>
            <p className="text-orange-100 text-xs">大卡</p>
          </div>
          {profile && (
            <div className="text-right text-sm">
              <p className="text-orange-100">目標 {profile.dailyCalorieGoal} 大卡</p>
              <p className={`text-lg font-bold mt-1 ${totalCal > profile.dailyCalorieGoal ? 'text-red-200' : 'text-white'}`}>
                {totalCal > profile.dailyCalorieGoal ? `超出 ${totalCal - profile.dailyCalorieGoal}` : `剩餘 ${profile.dailyCalorieGoal - totalCal}`}
              </p>
            </div>
          )}
        </div>
        {totalCal > 0 && (
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            <div>
              <p className="text-lg font-bold">{totalProtein.toFixed(0)}g</p>
              <p className="text-orange-100 text-xs">蛋白質</p>
            </div>
            <div>
              <p className="text-lg font-bold">{totalCarbs.toFixed(0)}g</p>
              <p className="text-orange-100 text-xs">碳水</p>
            </div>
            <div>
              <p className="text-lg font-bold">{totalFat.toFixed(0)}g</p>
              <p className="text-orange-100 text-xs">脂肪</p>
            </div>
          </div>
        )}
      </div>

      {/* Meal Sections */}
      {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((type) => {
        const typeMeals = dateMeals.filter((m) => m.type === type)
        const typeCal = typeMeals.reduce((s, m) => s + m.totalCalories, 0)
        return (
          <div key={type} className="card mb-3">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-xl">{MEAL_EMOJIS[type]}</span>
                <span className="font-semibold text-gray-800">{MEAL_LABELS[type]}</span>
                {typeCal > 0 && (
                  <span className="tag bg-orange-50 text-orange-600">{typeCal} 大卡</span>
                )}
              </div>
              <button
                onClick={() => openModal(type)}
                className="w-7 h-7 rounded-full bg-primary-500 text-white flex items-center justify-center text-lg leading-none"
              >
                +
              </button>
            </div>

            {typeMeals.length === 0 ? (
              <p className="text-gray-300 text-sm text-center py-1">尚未記錄</p>
            ) : (
              <div className="space-y-2">
                {typeMeals.map((meal) => (
                  <div key={meal.id} className="bg-gray-50 rounded-xl p-3">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">
                          {meal.foods.map((f) => f.name).join('、')}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {meal.foods.map((f) => `${f.calories}大卡`).join(' + ')}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-orange-500">
                          {meal.totalCalories}
                        </span>
                        <button
                          onClick={() => removeMeal(meal.id)}
                          className="text-gray-300 hover:text-red-400 text-lg leading-none"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}

      {/* Add Meal Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-white w-full max-w-[430px] mx-auto rounded-t-3xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-100 px-5 py-4 flex items-center justify-between rounded-t-3xl">
              <h3 className="font-bold text-gray-800">
                {MEAL_EMOJIS[mealType]} 新增{MEAL_LABELS[mealType]}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 text-2xl leading-none">×</button>
            </div>

            <div className="px-5 py-4 space-y-4 pb-8">
              {/* Food list */}
              {foods.length > 0 && (
                <div className="space-y-2">
                  <p className="text-sm font-medium text-gray-600">已加入食物：</p>
                  {foods.map((f) => (
                    <div key={f.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                      <div>
                        <p className="text-sm font-medium text-gray-700">{f.name}</p>
                        <p className="text-xs text-gray-400">{f.calories} 大卡</p>
                      </div>
                      <button onClick={() => removeFood(f.id)} className="text-gray-300 text-xl">×</button>
                    </div>
                  ))}
                  <div className="text-right text-sm font-semibold text-orange-500">
                    共 {foods.reduce((s, f) => s + f.calories, 0)} 大卡
                  </div>
                </div>
              )}

              {/* Search/Add buttons */}
              {!showFoodSearch && !showCustom && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setShowFoodSearch(true)}
                    className="py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 text-sm"
                  >
                    🔍 從食物庫選擇
                  </button>
                  <button
                    onClick={() => setShowCustom(true)}
                    className="py-3 rounded-xl border-2 border-dashed border-gray-200 text-gray-500 text-sm"
                  >
                    ✏️ 自訂食物
                  </button>
                </div>
              )}

              {/* Food search */}
              {showFoodSearch && (
                <div>
                  <div className="flex gap-2 mb-3">
                    <input
                      className="input-field flex-1"
                      placeholder="搜尋食物..."
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      autoFocus
                    />
                    <button onClick={() => { setShowFoodSearch(false); setSearch('') }} className="text-gray-400">取消</button>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {filteredFoods.map((f) => (
                      <button
                        key={f.name}
                        onClick={() => addCommonFood(f)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-primary-50 transition-colors"
                      >
                        <span className="text-sm text-gray-700">{f.name}</span>
                        <span className="text-xs text-gray-400">{f.calories} 大卡</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Custom food */}
              {showCustom && (
                <div className="space-y-3">
                  <input className="input-field" placeholder="食物名稱" value={customFood.name} onChange={(e) => setCustomFood(p => ({ ...p, name: e.target.value }))} />
                  <input className="input-field" type="number" placeholder="熱量（大卡）" value={customFood.calories} onChange={(e) => setCustomFood(p => ({ ...p, calories: e.target.value }))} />
                  <div className="grid grid-cols-3 gap-2">
                    <input className="input-field text-sm" type="number" placeholder="蛋白質(g)" value={customFood.protein} onChange={(e) => setCustomFood(p => ({ ...p, protein: e.target.value }))} />
                    <input className="input-field text-sm" type="number" placeholder="碳水(g)" value={customFood.carbs} onChange={(e) => setCustomFood(p => ({ ...p, carbs: e.target.value }))} />
                    <input className="input-field text-sm" type="number" placeholder="脂肪(g)" value={customFood.fat} onChange={(e) => setCustomFood(p => ({ ...p, fat: e.target.value }))} />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button onClick={() => setShowCustom(false)} className="btn-secondary text-sm py-2">取消</button>
                    <button onClick={addCustomFoodItem} className="btn-primary text-sm py-2">新增</button>
                  </div>
                </div>
              )}

              {/* Notes */}
              <input
                className="input-field"
                placeholder="備註（選填）"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />

              {/* Save */}
              <button
                onClick={saveMeal}
                disabled={foods.length === 0}
                className={`btn-primary ${foods.length === 0 ? 'opacity-40' : ''}`}
              >
                儲存餐點
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
