import { useMemo, useState, useEffect, useRef } from 'react'
import { useWriteContract, useReadContract } from 'wagmi'
import { intervalToDuration, startOfDay } from 'date-fns'
import Modal from 'react-modal'
import Controller from '../../../deployments/testnet/ETHRegistrarController.json'
import DatePicker from 'react-datepicker'
import { useEstimateENSFees } from '../hooks/gasEstimation'
import { zeroAddress } from 'viem'
import { constants } from '../constant'

interface RenewProps {
  expires: bigint
  label: string
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>
  isOpen: boolean
  number: number
}
const renewAbi = [
  {
    inputs: [
      {
        internalType: 'string',
        name: 'name',
        type: 'string',
      },
      {
        internalType: 'uint256',
        name: 'duration',
        type: 'uint256',
      },
    ],
    name: 'renew',
    outputs: [],
    stateMutability: 'payable',
    type: 'function',
  },
]
const PriceAbi = [
  {
    inputs: [],
    name: 'latestRoundData',
    outputs: [
      {
        internalType: 'uint80',
        name: 'roundId',
        type: 'uint80',
      },
      {
        internalType: 'int256',
        name: 'answer',
        type: 'int256',
      },
      {
        internalType: 'uint256',
        name: 'startedAt',
        type: 'uint256',
      },
      {
        internalType: 'uint256',
        name: 'updatedAt',
        type: 'uint256',
      },
      {
        internalType: 'uint80',
        name: 'answeredInRound',
        type: 'uint80',
      },
    ],
    stateMutability: 'view',
    type: 'function',
  },
]

Modal.setAppElement('#root')

const Renew = ({ expires, label, setIsOpen, isOpen, number }: RenewProps) => {
  const {
    data: renewHash,
    error: renewError,
    isPending: renewPending,
    writeContractAsync: renewContract,
  } = useWriteContract()

  function onRequestClose(): void {
    setNext(1)
    setIsOpen(false)
  }
  const [years, setYears] = useState(1)
  const now = useMemo(() => {
    if (!expires) {
      return 31536000
    } else {
      return new Date(Number(expires) * 1000)
    }
  }, [expires])
  const nextYear = useMemo(() => {
    const d = new Date(now)
    d.setFullYear(d.getFullYear() + 1)
    return d
  }, [now])
  const minDate = useMemo(() => {
    const d = new Date(now)
    d.setDate(d.getDate() + 28)
    return d
  }, [now])

  const [input, setInput] = useState(true)
  const [next, setNext] = useState(number)
  const [date, setDate] = useState(true)
  const [picker, setPicker] = useState(false)
  const [dateText, setDateText] = useState<Date | null>(nextYear)
  const [disable, setDisable] = useState(true)
  const [seconds, setSeconds] = useState(0)
  const [currency, setCurrency] = useState<'BNB' | 'USD'>('BNB')
  const [bnb, setBnb] = useState(true)

  const { data: latest, isPending: loading } = useReadContract({
    address: constants.Controller, // Replace with actual contract address
    abi: Controller.abi as any, // Replace with actual ABI
    functionName: 'rentPrice',
    args: [label as string, seconds],
  })
  const { data: priceData } = useReadContract({
    address: '0x2514895c72f50D8bd4B4F9b1110F0D6bD2c97526', // Replace with actual contract address
    abi: PriceAbi as any, // Replace with actual ABI
    functionName: 'latestRoundData',
  })

  const { fees, loading: estimateLoading } = useEstimateENSFees({
    name: `${label}`,
    owner: zeroAddress as `0x${string}`,
    duration: seconds, // seconds
  })

  const [estimateBnb, setEstimateBnb] = useState('')
  const [estimateUsd, setEstimateUsd] = useState('')
  useEffect(() => {
    const bnb = Number(fees?.fee.totalEth).toFixed(4)
    setEstimateBnb(bnb as string)

    const [, answer, , ,] = (priceData as any) || [0, 0, 0, 0, 0]
    const usd = (Number(fees?.fee.totalEth) * Number(answer)) / 1e8
    setEstimateUsd(usd.toFixed(2))
  }, [fees, priceData])

  const price = useMemo(() => {
    const { base } = (latest as any) || { base: 0 }
    const [, answer, , ,] = (priceData as any) || [0, 0, 0, 0, 0]
    const bnbPrice = Number(answer) / 1e8 // Chainlink ETH/USD has 8 decimals
    const costInEth = Number(base) / 1e18 // your base is in wei
    const usdCost = costInEth * bnbPrice
    return { bnb: costInEth.toFixed(4), usd: usdCost.toFixed(2) }
  }, [latest, priceData, seconds])

  const inputRef = useRef<HTMLInputElement>(null)

  // close on outside click
  const containerRef = useRef<HTMLDivElement>(null)

  const duration = useMemo(() => {
    if (!dateText) {
      return { years: 0, months: 0, days: 0 }
    }
    // normalize both to midnight
    const start = startOfDay(now)
    const end = startOfDay(dateText)

    const d = intervalToDuration({ start, end })
    return { years: d.years || 0, months: d.months || 0, days: d.days || 0 }
  }, [nextYear, dateText])

  // close when clicking outside
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        picker &&
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setPicker(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [picker])

  useEffect(() => {
    if (dateText && !date) {
      const d = new Date(dateText)
      setSeconds((startOfDay(d).getTime() - startOfDay(now).getTime()) / 1000)
    }
  }, [dateText, date])

  useEffect(() => {
    if (date) {
      setSeconds(31536000 * years)
    }
  }, [date, years])

  const increment = () => {
    setYears((prev) => prev + 1)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      // Guard: must have both elements
      if (!input && inputRef.current) {
        const clickedNode = event.target as Node
        // If click is outside *both* the input and the box, close
        if (!inputRef.current.contains(clickedNode)) {
          setInput(true)
        }
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [input])

  useEffect(() => {
    if (years == 1) {
      setDisable(true)
    }
    if (years > 1) {
      setDisable(false)
    }
  }, [years])

  const decrease = () => {
    setYears((prev) => prev - 1)
  }

  const renew = async () => {
    const { base, premium } = latest as { base: bigint; premium: bigint }
    try {
      await renewContract({
        abi: renewAbi,
        address: constants.Controller,
        functionName: 'renew',
        args: [label, seconds],
        value: base + premium,
      })
    } catch (error) {
      console.error(error);
      console.error(renewError);
    }
  }
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setYears(Number(event.target.value))
  }
  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={onRequestClose}
      closeTimeoutMS={300} // animation duration (matches CSS)
      className="modal-content"
      overlayClassName="modal-overlay"
    >
      {next == 0 ? (
        <div className="rounded-xl bg-neutral-800 px-10 py-5 mt-5 border-[0.5px] flex justify-center text-center border-gray-400 h-100 w-100">
          You are not the owner would you like to proceed with this
        </div>
      ) : next == 1 ? (
        <div className="rounded-xl bg-neutral-800 px-10 py-5 mt-5 border-[0.5px] border-gray-400 h-120 w-150">
          <h1 className="text-lg font-semibold text-white">
            {' '}
            Renew {label}.safu{' '}
          </h1>
          {date ? (
            <div className="rounded-full p-5 border-[0.5px] border-gray-400 mt-5 flex items-center">
              <button
                className="flex items-center justify-center text-4xl w-10 h-10 p-7 rounded-full border-[0.5px] cursor-pointer border-gray-400 bg-[#FFF700] disabled:bg-neutral-500 disabled:cursor-not-allowed text-neutral-900 "
                disabled={disable}
                onClick={decrease}
              >
                -
              </button>
              {input ? (
                <div
                  className="text-4xl text-[#FFF700] font-semibold grow-1 text-center hover:bg-[#807F00]  transition-all duration-300 rounded-full cursor-pointer mx-5"
                  onClick={() => {
                    setInput(false)
                  }}
                >
                  <p className="opacity-90">
                    {years} Year{years > 1 ? 's' : ''}
                  </p>
                </div>
              ) : (
                <input
                  ref={inputRef}
                  type="number"
                  min={1}
                  className="text-4xl text-[#FFF700] font-semibold grow-1 text-center hover:bg-[#807F00]  transition-all duration-300 rounded-full cursor-pointer mx-5"
                  value={years}
                  onChange={handleChange}
                />
              )}
              <button
                className="flex items-center justify-center text-4xl w-10 h-10 p-7 rounded-full bg-[#FFF700] border-[0.5px] border-gray-400 cursor-pointer text-neutral-900"
                onClick={increment}
              >
                +
              </button>
            </div>
          ) : (
            <div
              ref={containerRef}
              className="rounded-full p-5 border-[0.5px] border-gray-400 mt-5 flex items-center hover:bg-[#807F00] cursor-pointer transition-all ease-in-out duration-300 relative"
              onClick={() => {
                setPicker(true)
              }}
            >
              <DatePicker
                selected={dateText}
                onChange={(d) => setDateText(d)}
                open={picker}
                onClickOutside={() => setPicker(false)}
                minDate={minDate}
                dateFormat="MMMM d, yyyy"
                customInput={<div style={{ display: 'none' }} />}
                popperPlacement="bottom-start"
                className="z-50 mt-50"
                // ◀️ Custom wrapper for the calendar popper
                calendarContainer={({ className, children }) => (
                  <div
                    style={{
                      width: 'auto,',
                    }}
                    className={`${className} absolute top-full left-0 mt-7 z-50`}
                  >
                    {children}
                  </div>
                )}
              />
              <div className="flex grow-1 text-3xl text-[#FFF700] font-semibold relative items-center ">
                {dateText?.toLocaleString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </div>

              <button className="flex items-center justify-center text-6xl w-10 h-10 p-7 rounded-full bg-[#FFF700] border-[0.5px] border-gray-400 cursor-pointer text-neutral-900">
                +
              </button>
            </div>
          )}
          {date ? (
            <p className="text-center mt-5 text-sm flex justify-center font-semibold">
              {years} year{years > 1 ? 's' : ''} registration.{' '}
              <span
                className="text-[#FFF700] text-center ml-2 cursor-pointer"
                onClick={() => {
                  setDate(!date)
                }}
              >
                Pick by date
              </span>
            </p>
          ) : (
            <p className="text-center mt-5 text-sm flex justify-center font-semibold">
              {duration.years > 0
                ? ` ${duration.years} year${duration.years > 1 ? 's' : ''}`
                : ''}
              {duration.months > 0
                ? `${duration.years > 0 ? ',' : ''} ${duration.months} months`
                : ''}
              {duration.days > 0
                ? `${duration.months > 0 ? ',' : ''} ${duration.days} days`
                : ''}{' '}
              registration.{' '}
              <span
                className="text-[#FFF700] text-center ml-2 cursor-pointer"
                onClick={() => {
                  setDate(!date)
                }}
              >
                Pick by Years
              </span>
            </p>
          )}
          <div>
            <div className="inline-flex bg-neutral-900 rounded-full p-1">
              {(['BNB', 'USD'] as const).map((curr) => {
                const isActive = curr === currency
                return (
                  <button
                    key={curr}
                    onClick={() => {
                      setCurrency(curr)
                      setBnb(!bnb)
                    }}
                    className={`
                            px-4 py-2 text-sm font-medium rounded-full transition cursor-pointer 
                            ${
                              isActive
                                ? 'bg-[#FFF700] text-neutral-800' // active
                                : 'text-gray-400 hover:text-white'
                            } // inactive
                            `}
                  >
                    {curr}
                  </button>
                )
              })}
            </div>
            <div className="rounded-xl bg-neutral-900 px-5 py-5 mt-5">
              {bnb ? (
                <div className="space-y-1">
                  <div className="flex">
                    {date ? (
                      <div className="text-sm flex font-semibold text-gray-400 grow-1">
                        {years} year{years > 1 ? 's' : ''} registration
                      </div>
                    ) : (
                      <div className="text-sm flex font-semibold text-gray-400 grow-1">
                        {duration.years > 0
                          ? ` ${duration.years} year${
                              duration.years > 1 ? 's' : ''
                            }`
                          : ''}
                        {duration.months > 0
                          ? `${duration.years > 0 ? ',' : ''} ${
                              duration.months
                            } months`
                          : ''}
                        {duration.days > 0
                          ? `${duration.months > 0 ? ',' : ''} ${
                              duration.days
                            } days`
                          : ''}{' '}
                        registration.
                      </div>
                    )}

                    {loading ? (
                      <div className="animate-pulse">
                        <div className="animate-pulse w-20 h-6 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
                      </div>
                    ) : (
                      <div className="text-gray-400">{price.bnb} BNB</div>
                    )}
                  </div>
                  <div className="flex">
                    <div className="text-sm flex font-semibold text-gray-400 grow-1">
                      Estimated Gas Fee
                    </div>

                    {estimateLoading || estimateBnb == 'NaN' ? (
                      <div className="animate-pulse">
                        <div className="animate-pulse w-20 h-6 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
                      </div>
                    ) : (
                      <div className="text-gray-400">{estimateBnb} BNB</div>
                    )}
                  </div>
                  <div className="flex">
                    <div className="text-sm flex font-semibold text-white grow-1">
                      Estimated Total
                    </div>

                    {loading || estimateLoading || estimateBnb == 'NaN' ? (
                      <div className="animate-pulse">
                        <div className="animate-pulse w-20 h-6 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
                      </div>
                    ) : (
                      <div className="text-white">
                        {(Number(estimateBnb) + Number(price.bnb)).toFixed(4)}{' '}
                        BNB
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex">
                    {date ? (
                      <div className="text-sm flex font-semibold text-gray-400 grow-1">
                        {years} year{years > 1 ? 's' : ''} registration
                      </div>
                    ) : (
                      <div className="text-sm flex font-semibold text-gray-400 grow-1">
                        {duration.years > 0
                          ? ` ${duration.years} year${
                              duration.years > 1 ? 's' : ''
                            }`
                          : ''}
                        {duration.months > 0
                          ? `${duration.years > 0 ? ',' : ''} ${
                              duration.months
                            } months`
                          : ''}
                        {duration.days > 0
                          ? `${duration.months > 0 ? ',' : ''} ${
                              duration.days
                            } days`
                          : ''}{' '}
                        registration.
                      </div>
                    )}

                    {loading ? (
                      <div className="animate-pulse">
                        <div className="animate-pulse w-20 h-6 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
                      </div>
                    ) : (
                      <div className="text-gray-400">${price.usd}</div>
                    )}
                  </div>
                  <div className="flex">
                    <div className="text-sm flex font-semibold text-gray-400 grow-1">
                      Estimated Gas Fee
                    </div>

                    {estimateLoading || estimateUsd == 'NaN' ? (
                      <div className="animate-pulse">
                        <div className="animate-pulse w-20 h-6 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
                      </div>
                    ) : (
                      <div className="text-gray-400">${estimateUsd}</div>
                    )}
                  </div>
                  <div className="flex">
                    <div className="text-sm flex font-semibold text-white grow-1">
                      Estimated Total
                    </div>

                    {loading || estimateLoading || estimateUsd == 'NaN' ? (
                      <div className="animate-pulse">
                        <div className="animate-pulse w-20 h-6 rounded-full bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800" />
                      </div>
                    ) : (
                      <div className="text-white">
                        ${(Number(estimateUsd) + Number(price.usd)).toFixed(2)}{' '}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center justify-center">
            <button
              className="px-5 py-3 bg-[#FFF700] text-neutral-900 font-semibold mt-5 rounded-xl cursor-pointer hover:bg-[#B3AE00] transition-all duration-300 flex items-center"
              onClick={() => {
                setNext(2)
                renew()
              }}
            >
              Next
            </button>
          </div>
        </div>
      ) : next == 2 ? (
        <div className="p-8 rounded-2xl bg-white dark:bg-neutral-900 shadow-xl relative w-[300px] md:w-[450px] mx-auto flex flex-col gap-6">
          <button
            onClick={onRequestClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-2xl"
          >
            ×
          </button>

          <h2 className="text-2xl font-bold text-center text-neutral-800 dark:text-white">
            Confirm Details
          </h2>

          <p className="text-center text-gray-500">
            Double check these details before confirming in your wallet.
          </p>

          <div className="flex flex-col gap-3">
            <div className="flex justify-between items-center border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="text-gray-500 text-sm">Name</div>
              <div className="flex items-center gap-2 font-bold text-black dark:text-white">
                {`${label}.safu`}
                <div className="w-4 h-4 rounded-full bg-gradient-to-r from-pink-400 to-pink-600" />
              </div>
            </div>

            <div className="flex justify-between items-center border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <div className="text-gray-500 text-sm">Action</div>
              <div className="font-bold text-black dark:text-white">
                Renew Name
              </div>
            </div>
            {!renewPending && renewHash && (
              <div className="flex justify-between items-center border border-gray-200 dark:border-gray-700 rounded-lg p-3">
                <div className="text-gray-500 text-sm w-20">Hash</div>
                <div className="font-bold text-black dark:text-white flex-wrap break-all text-sm">
                  {renewHash}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        ''
      )}
    </Modal>
  )
}
export default Renew
